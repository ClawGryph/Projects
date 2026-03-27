<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OfficialReceipt;
use App\Models\Form2307;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class UploadFileController extends Controller
{
    /**
     * Upload O.R. file for a given official receipt.
     * POST /official-receipts/{id}/upload-file
     */
    public function uploadOrFile(Request $request, $id)
    {
        $request->validate([
            'file' => 'required|file|mimes:jpg,jpeg,png,pdf|max:10240', // 10MB max
        ]);

        $receipt = OfficialReceipt::findOrFail($id);

        // Delete old file from Cloudinary if exists
        if ($receipt->or_file_path) {
            // Only delete if it's a Cloudinary URL
            if (str_contains($receipt->or_file_path, 'cloudinary.com')) {
                $publicId = pathinfo(parse_url($receipt->or_file_path, PHP_URL_PATH), PATHINFO_FILENAME);
                Storage::disk('cloudinary')->delete($publicId);
            }
        }

        // Upload new file to Cloudinary
        $path = Storage::disk('cloudinary')->putFile(
            'official-receipts',
            $request->file('file')
        );

        // Build full Cloudinary URL
        $mimeType = $request->file('file')->getMimeType();
        $resourceType = $mimeType === 'application/pdf' ? 'raw' : 'image';
        $fullUrl = 'https://res.cloudinary.com/' . env('CLOUDINARY_CLOUD_NAME') . '/' . $resourceType . '/upload/' . $path;

        $receipt->update(['or_file_path' => $fullUrl]);

        return response()->json([
            'message'      => 'O.R. file uploaded successfully.',
            'or_file_path' => $fullUrl,
            'or_file_url'  => $fullUrl,
        ]);
    }

    /**
     * Upload 2307 file for a given form 2307.
     * POST /form-2307s/{id}/upload-file
     */
    public function upload2307File(Request $request, $id)
    {
        $request->validate([
            'file' => 'required|file|mimes:jpg,jpeg,png,pdf|max:10240',
        ]);

        $form = Form2307::findOrFail($id);

        // Delete old file from Cloudinary if exists
        if ($form->form_file_path) {
            Storage::disk('cloudinary')->delete($form->form_file_path);
        }

        // Upload new file to Cloudinary
        $path = Storage::disk('cloudinary')->putFile(
            'form-2307s',
            $request->file('file')
        );

        $mimeType = $request->file('file')->getMimeType();
        $resourceType = $mimeType === 'application/pdf' ? 'raw' : 'image';
        $fullUrl = 'https://res.cloudinary.com/' . env('CLOUDINARY_CLOUD_NAME') . '/' . $resourceType . '/upload/' . $path;

        $form->update(['form_file_path' => $fullUrl]);

        return response()->json([
            'message'        => '2307 file uploaded successfully.',
            'form_file_path' => $fullUrl,
            'form_file_url'  => $fullUrl,
        ]);
    }
}
