from flask import Flask, render_template, request, jsonify, send_file
import os
import json
from pathlib import Path
import pydicom
import numpy as np
from PIL import Image
import io
import base64
from scipy.optimize import curve_fit
from scipy.stats import norm
from scipy.ndimage import map_coordinates

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 500 * 1024 * 1024  # 500MB max

# Store loaded DICOM data in memory
dicom_cache = {}

def get_directory_tree(path, max_depth=3, current_depth=0):
    """Generate directory tree structure"""
    if current_depth >= max_depth:
        return None
    
    try:
        items = []
        path_obj = Path(path)
        
        if not path_obj.exists():
            return None
        
        for item in sorted(path_obj.iterdir()):
            if item.name.startswith('.'):
                continue
            
            if item.is_dir():
                children = get_directory_tree(str(item), max_depth, current_depth + 1)
                items.append({
                    'name': item.name,
                    'path': str(item),
                    'type': 'folder',
                    'children': children if children else []
                })
            elif item.is_file() and item.suffix.lower() in ['.dcm', '.dicom']:
                items.append({
                    'name': item.name,
                    'path': str(item),
                    'type': 'file'
                })
        
        return items
    except PermissionError:
        return None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/browse', methods=['POST'])
def browse():
    """Get directory tree for a given path"""
    data = request.json
    path = data.get('path', os.path.expanduser('~'))
    
    if not os.path.exists(path):
        return jsonify({'error': 'Path not found'}), 404
    
    tree = get_directory_tree(path)
    return jsonify({'tree': tree, 'path': path})

@app.route('/api/load-dicom-files', methods=['POST'])
def load_dicom_files():
    """Load DICOM files uploaded from browser"""
    data = request.json
    files_data = data.get('files', [])
    
    if not files_data:
        return jsonify({'error': 'No files provided'}), 400
    
    try:
        # Load all DICOM files from byte arrays
        datasets = []
        for file_info in files_data:
            try:
                byte_array = bytes(file_info['data'])
                ds = pydicom.dcmread(io.BytesIO(byte_array))
                datasets.append((file_info['name'], ds))
            except Exception as e:
                print(f"Error reading {file_info['name']}: {e}")
                continue
        
        if not datasets:
            return jsonify({'error': 'Could not read DICOM files'}), 400
        
        # Sort by instance number or file order
        datasets.sort(key=lambda x: int(x[1].get('InstanceNumber', 0)) if 'InstanceNumber' in x[1] else 0)
        
        # Extract pixel data
        pixel_arrays = []
        for name, ds in datasets:
            if hasattr(ds, 'pixel_array'):
                # Handle multi-frame DICOM
                if ds.pixel_array.ndim == 3:
                    for i in range(ds.pixel_array.shape[0]):
                        pixel_arrays.append(ds.pixel_array[i])
                else:
                    pixel_arrays.append(ds.pixel_array)
        
        if not pixel_arrays:
            return jsonify({'error': 'No pixel data found'}), 400
        
        # Stack arrays
        stack = np.array(pixel_arrays)
        
        # Normalize to 0-255
        stack_min = stack.min()
        stack_max = stack.max()
        if stack_max > stack_min:
            stack_normalized = ((stack - stack_min) / (stack_max - stack_min) * 255).astype(np.uint8)
        else:
            stack_normalized = stack.astype(np.uint8)
        
        # Store in cache
        cache_id = str(hash(tuple(f['name'] for f in files_data)))
        dicom_cache[cache_id] = {
            'stack': stack_normalized,
            'original_stack': stack,
            'path': 'uploaded',
            'num_files': len(datasets)
        }
        
        return jsonify({
            'success': True,
            'cache_id': cache_id,
            'shape': list(stack_normalized.shape),
            'num_files': len(datasets)
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/load-dicom', methods=['POST'])
def load_dicom():
    """Load DICOM files from a path"""
    data = request.json
    path = data.get('path')
    
    if not os.path.exists(path):
        return jsonify({'error': 'Path not found'}), 404
    
    dicom_files = []
    
    if os.path.isfile(path):
        dicom_files = [path]
    else:
        # Recursively find all DICOM files
        for root, dirs, files in os.walk(path):
            for file in sorted(files):
                if file.lower().endswith(('.dcm', '.dicom')):
                    dicom_files.append(os.path.join(root, file))
    
    if not dicom_files:
        return jsonify({'error': 'No DICOM files found'}), 404
    
    try:
        # Load all DICOM files
        datasets = []
        for dcm_path in dicom_files:
            try:
                ds = pydicom.dcmread(dcm_path)
                datasets.append((dcm_path, ds))
            except Exception as e:
                print(f"Error reading {dcm_path}: {e}")
                continue
        
        if not datasets:
            return jsonify({'error': 'Could not read DICOM files'}), 400
        
        # Sort by instance number or file order
        datasets.sort(key=lambda x: int(x[1].get('InstanceNumber', 0)) if 'InstanceNumber' in x[1] else 0)
        
        # Extract pixel data
        pixel_arrays = []
        for dcm_path, ds in datasets:
            if hasattr(ds, 'pixel_array'):
                pixel_arrays.append(ds.pixel_array)
        
        if not pixel_arrays:
            return jsonify({'error': 'No pixel data found'}), 400
        
        # Stack arrays
        stack = np.array(pixel_arrays)
        
        # Normalize to 0-255
        stack_min = stack.min()
        stack_max = stack.max()
        if stack_max > stack_min:
            stack_normalized = ((stack - stack_min) / (stack_max - stack_min) * 255).astype(np.uint8)
        else:
            stack_normalized = stack.astype(np.uint8)
        
        # Store in cache
        cache_id = str(hash(path))
        dicom_cache[cache_id] = {
            'stack': stack_normalized,
            'original_stack': stack,
            'path': path,
            'num_files': len(datasets)
        }
        
        return jsonify({
            'success': True,
            'cache_id': cache_id,
            'shape': list(stack_normalized.shape),
            'num_files': len(datasets)
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/get-projection', methods=['POST'])
def get_projection():
    """Get a specific projection (axial, sagittal, coronal)"""
    data = request.json
    cache_id = data.get('cache_id')
    projection = data.get('projection')  # 'axial', 'sagittal', 'coronal'
    slice_idx = data.get('slice_idx', 0)
    window_center = data.get('window_center', None)
    window_width = data.get('window_width', None)
    
    if cache_id not in dicom_cache:
        return jsonify({'error': 'Cache not found'}), 404
    
    stack = dicom_cache[cache_id]['stack']
    
    # Get projection
    if projection == 'axial':
        img_array = stack[slice_idx, :, :]
    elif projection == 'sagittal':
        img_array = stack[:, slice_idx, :]
    elif projection == 'coronal':
        img_array = stack[:, :, slice_idx]
    else:
        return jsonify({'error': 'Invalid projection'}), 400
    
    # Apply windowing if specified
    if window_center is not None and window_width is not None:
        original_stack = dicom_cache[cache_id]['original_stack']
        if projection == 'axial':
            original_img = original_stack[slice_idx, :, :]
        elif projection == 'sagittal':
            original_img = original_stack[:, slice_idx, :]
        else:
            original_img = original_stack[:, :, slice_idx]
        
        # Apply DICOM windowing
        lower_bound = window_center - window_width / 2
        upper_bound = window_center + window_width / 2
        windowed = np.clip(original_img, lower_bound, upper_bound)
        windowed = ((windowed - lower_bound) / window_width * 255).astype(np.uint8)
        img_array = windowed
    
    # Convert to image
    img = Image.fromarray(img_array, mode='L')
    
    # Convert to base64
    img_io = io.BytesIO()
    img.save(img_io, 'PNG')
    img_io.seek(0)
    img_base64 = base64.b64encode(img_io.getvalue()).decode()
    
    return jsonify({
        'image': f'data:image/png;base64,{img_base64}',
        'shape': list(img_array.shape),
        'max_slices': list(stack.shape)[0 if projection == 'axial' else (1 if projection == 'sagittal' else 2)]
    })

@app.route('/api/gaussian-profile', methods=['POST'])
def gaussian_profile():
    """Perform Gaussian profile analysis on ROI"""
    data = request.json
    cache_id = data.get('cache_id')
    projection = data.get('projection')
    slice_idx = data.get('slice_idx')
    roi = data.get('roi')  # {'x1', 'y1', 'x2', 'y2'}
    
    if cache_id not in dicom_cache:
        return jsonify({'error': 'Cache not found'}), 404
    
    stack = dicom_cache[cache_id]['original_stack']
    
    # Get the image slice
    if projection == 'axial':
        img_array = stack[slice_idx, :, :]
    elif projection == 'sagittal':
        img_array = stack[:, slice_idx, :]
    elif projection == 'coronal':
        img_array = stack[:, :, slice_idx]
    else:
        return jsonify({'error': 'Invalid projection'}), 400
    
    # Extract ROI coordinates
    x1, y1, x2, y2 = int(roi['x1']), int(roi['y1']), int(roi['x2']), int(roi['y2'])
    x1, x2 = min(x1, x2), max(x1, x2)
    y1, y2 = min(y1, y2), max(y1, y2)
    
    # Clamp to image boundaries
    img_height, img_width = img_array.shape
    x1 = max(0, min(x1, img_width - 1))
    x2 = max(1, min(x2, img_width))
    y1 = max(0, min(y1, img_height - 1))
    y2 = max(1, min(y2, img_height))
    
    # Extract ROI
    roi_img = img_array[y1:y2, x1:x2]
    
    if roi_img.size == 0:
        return jsonify({'error': 'ROI is empty'}), 400
    
    # Determine major axis (longer dimension)
    height, width = roi_img.shape
    
    if width >= height:
        # Major axis is horizontal (width)
        # Average along vertical axis (collapse rows)
        profile = np.mean(roi_img, axis=0)
    else:
        # Major axis is vertical (height)
        # Average along horizontal axis (collapse columns)
        profile = np.mean(roi_img, axis=1)
    
    # Convert to float for fitting
    profile = profile.astype(float)
    
    # Fit Gaussian on original profile (no normalization for fitting)
    x_data = np.arange(len(profile))
    
    def gaussian_with_baseline(x, amp, mu, sig, base):
        return base + amp * np.exp(-0.5 * ((x - mu) / sig) ** 2)
    
    # Try both normal and inverted gaussians
    fit_params = {}
    fit_curve = profile
    
    # Determine if peak or valley
    peak_idx = np.argmax(profile)
    valley_idx = np.argmin(profile)
    peak_height = profile[peak_idx]
    valley_height = profile[valley_idx]
    
    # Try normal gaussian (peak)
    amplitude_peak = peak_height - np.mean(profile)
    baseline_peak = np.mean(profile)
    
    try:
        popt_peak, _ = curve_fit(gaussian_with_baseline, x_data, profile, 
                                p0=[amplitude_peak, peak_idx, len(profile) / 4, baseline_peak], 
                                maxfev=10000)
        fit_peak = gaussian_with_baseline(x_data, *popt_peak)
        residual_peak = np.sum((profile - fit_peak) ** 2)
    except Exception as e:
        print(f"Peak fit error: {e}")
        popt_peak = None
        residual_peak = float('inf')
    
    # Try inverted gaussian (valley)
    amplitude_valley = np.mean(profile) - valley_height
    baseline_valley = np.mean(profile)
    
    try:
        popt_valley, _ = curve_fit(gaussian_with_baseline, x_data, profile, 
                                  p0=[-amplitude_valley, valley_idx, len(profile) / 4, baseline_valley], 
                                  maxfev=10000)
        fit_valley = gaussian_with_baseline(x_data, *popt_valley)
        residual_valley = np.sum((profile - fit_valley) ** 2)
    except Exception as e:
        print(f"Valley fit error: {e}")
        popt_valley = None
        residual_valley = float('inf')
    
    # Choose best fit
    if popt_peak is not None and residual_peak <= residual_valley:
        popt = popt_peak
        fit_curve = fit_peak
        fit_type = 'peak'
    elif popt_valley is not None:
        popt = popt_valley
        fit_curve = fit_valley
        fit_type = 'valley'
    else:
        popt = None
    
    if popt is not None:
        fit_params = {
            'amplitude': float(popt[0]), 
            'center': float(popt[1]), 
            'sigma': float(popt[2]),
            'baseline': float(popt[3]),
            'type': fit_type
        }
    else:
        fit_curve = profile
        fit_params = {}
    
    # Calculate R-squared
    ss_res = np.sum((profile - fit_curve) ** 2)
    ss_tot = np.sum((profile - np.mean(profile)) ** 2)
    r_squared = 1 - (ss_res / ss_tot) if ss_tot != 0 else 0
    
    # Calculate FWHM
    fwhm = 0
    center = 0
    if 'sigma' in fit_params:
        fwhm = 2.355 * fit_params['sigma']
        center = fit_params['center']
    
    return jsonify({
        'x_data': x_data.tolist(),
        'y_data': profile.tolist(),
        'y_fit': fit_curve.tolist(),
        'fwhm': fwhm,
        'center': center,
        'r_squared': r_squared,
        'params': fit_params,
        'roi': {'x1': x1, 'y1': y1, 'x2': x2, 'y2': y2}
    })

@app.route('/api/mtf-analysis', methods=['POST'])
def mtf_analysis():
    """Perform MTF (Modulation Transfer Function) analysis on a line ROI"""
    data = request.json
    cache_id = data.get('cache_id')
    projection = data.get('projection')
    slice_idx = data.get('slice_idx')
    roi = data.get('roi')  # {'x1', 'y1', 'x2', 'y2'} - line endpoints
    
    if cache_id not in dicom_cache:
        return jsonify({'error': 'Cache not found'}), 404
    
    stack = dicom_cache[cache_id]['original_stack']
    
    # Get the image slice
    if projection == 'axial':
        img_array = stack[slice_idx, :, :]
    elif projection == 'sagittal':
        img_array = stack[:, slice_idx, :]
    elif projection == 'coronal':
        img_array = stack[:, :, slice_idx]
    else:
        return jsonify({'error': 'Invalid projection'}), 400
    
    # Extract line endpoints
    x1, y1, x2, y2 = float(roi['x1']), float(roi['y1']), float(roi['x2']), float(roi['y2'])
    
    # Clamp to image boundaries
    img_height, img_width = img_array.shape
    x1 = max(0, min(x1, img_width - 1))
    x2 = max(0, min(x2, img_width - 1))
    y1 = max(0, min(y1, img_height - 1))
    y2 = max(0, min(y2, img_height - 1))
    
    # Calculate line length and number of points
    line_length = np.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
    num_points = int(line_length) + 1
    
    if num_points < 2:
        return jsonify({'error': 'Line too short'}), 400
    
    # Create line coordinates
    x_coords = np.linspace(x1, x2, num_points)
    y_coords = np.linspace(y1, y2, num_points)
    
    # Sample pixel values along the line
    coords = np.array([y_coords, x_coords])
    profile = map_coordinates(img_array.astype(float), coords, order=1, mode='constant', cval=0)
    
    # Calculate derivative (edge detection)
    derivative = np.gradient(profile)
    
    # Calculate FFT
    fft_result = np.fft.fft(derivative)
    mtf = np.abs(fft_result) / len(derivative)
    
    # Frequency axis (normalized)
    freqs = np.fft.fftfreq(len(derivative))
    
    # Only keep positive frequencies
    positive_freqs = freqs[:len(freqs)//2]
    positive_mtf = mtf[:len(mtf)//2]
    
    # Normalize MTF to 0-1
    if positive_mtf.max() > 0:
        positive_mtf_norm = positive_mtf / positive_mtf.max()
    else:
        positive_mtf_norm = positive_mtf
    
    return jsonify({
        'profile': profile.tolist(),
        'derivative': derivative.tolist(),
        'mtf': positive_mtf_norm.tolist(),
        'frequencies': positive_freqs.tolist(),
        'line': {'x1': x1, 'y1': y1, 'x2': x2, 'y2': y2}
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=False, host='0.0.0.0', port=port)
