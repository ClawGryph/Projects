<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\ClientsProjectController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\PaymentScheduleController;
use App\Http\Controllers\Api\PaymentTransactionController;
use App\Http\Controllers\Api\ProjectController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Http\Request;
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

Route::middleware(['auth:sanctum', 'role:super_admin,admin'])->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    Route::apiResource('/users', UserController::class);
    Route::apiResource('/clients', ClientController::class);
    Route::apiResource('/projects', ProjectController::class);
    Route::apiResource('/payments', PaymentController::class);
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::get('/clients/{client}/projects', [ClientsProjectController::class, 'index']);
    Route::post('/clients/{client}/projects', [ClientsProjectController::class, 'assignProject']);
    Route::get('/client-projects', [ClientsProjectController::class, 'projectsWithClients']);
    Route::put('/projects/{project}/status', [ProjectController::class, 'updateStatus']);
    Route::put('/payments/{payment}/status', [PaymentController::class, 'updateStatus']);
    Route::get('/transactions', [PaymentTransactionController::class, 'index']);
    Route::put('/payment-schedules/{schedule}/status', [PaymentScheduleController::class, 'updateStatus']);
});

Route::post('/login', [AuthController::class, 'login']);
