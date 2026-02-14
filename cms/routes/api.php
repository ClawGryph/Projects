<?php

use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\ClientsProjectController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\ProjectController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

Route::apiResource('/clients', ClientController::class);
Route::apiResource('/projects', ProjectController::class);
Route::apiResource('/payments', PaymentController::class);

Route::get('/clients/{client}/projects', [ClientsProjectController::class, 'index']);
Route::post('/clients/{client}/projects', [ClientsProjectController::class, 'assignProject']);
Route::get('/client-projects', [ClientsProjectController::class, 'projectsWithClients']);
Route::put('/projects/{project}/status', [ProjectController::class, 'updateStatus']);
Route::put('/payments/{payment}/status', [PaymentController::class, 'updateStatus']);
