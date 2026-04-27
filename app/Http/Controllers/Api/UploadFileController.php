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

        // Delete old file from local storage if exists
        if ($receipt->or_file_path && Storage::disk('public')->exists($receipt->or_file_path)) {
            Storage::disk('public')->delete($receipt->or_file_path);
        }

        // Store new file in storage/app/public/official-receipts
        $path = $request->file('file')->store('official-receipts', 'public');

        $receipt->update(['or_file_path' => $path]);

        return response()->json([
            'message'      => 'O.R. file uploaded successfully.',
            'or_file_path' => $path,
            'or_file_url'  => asset('storage/' . $path),
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

        // Delete old file from local storage if exists
        if ($form->form_file_path && Storage::disk('public')->exists($form->form_file_path)) {
            Storage::disk('public')->delete($form->form_file_path);
        }

        // Store new file in storage/app/public/form-2307s
        $path = $request->file('file')->store('form-2307s', 'public');

        $form->update(['form_file_path' => $path]);

        return response()->json([
            'message'        => '2307 file uploaded successfully.',
            'form_file_path' => $path,
            'form_file_url'  => asset('storage/' . $path),
        ]);
    }
}
