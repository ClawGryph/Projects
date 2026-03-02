<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\ClientsProjectController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\PaymentScheduleController;
use App\Http\Controllers\Api\PaymentTransactionController;
use App\Http\Controllers\Api\ProjectController;
use App\Http\Controllers\Api\UserController;
use App\Http\Resources\Resources\UserResource;
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

Route::post('/login', [AuthController::class, 'login']);

Route::middleware(['auth:sanctum'])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', function (Request $request) {
        return new UserResource(
            $request->user()->load('roles')
        );
    });
});

// Super Admin only
Route::middleware(['auth:sanctum', 'role:super_admin'])->group(function () {
    Route::apiResource('/users', UserController::class);
});

// Super Admin only can delete
Route::middleware(['auth:sanctum', 'role:super_admin'])->group(function () {
    Route::delete('/clients/{client}', [ClientController::class, 'destroy']);
    Route::delete('/projects/{project}', [ProjectController::class, 'destroy']);
});

// Super Admin and Admin can edit
Route::middleware(['auth:sanctum', 'role:super_admin,admin'])->group(function () {
    Route::put('/clients/{client}', [ClientController::class, 'update']);
    Route::put('/projects/{project}', [ProjectController::class, 'update']);
    Route::put('/payments/{payment}', [PaymentController::class, 'update']);
});

// Super Admin and Admin only
Route::middleware(['auth:sanctum', 'role:super_admin,admin'])->group(function () {
    Route::post('/clients', [ClientController::class, 'store']);
    Route::post('/projects', [ProjectController::class, 'store']);
    Route::post('/payments', [PaymentController::class, 'store']);
    Route::post('/clients/{client}/projects', [ClientsProjectController::class, 'assignProject']);
    Route::put('/projects/{project}/status', [ProjectController::class, 'updateStatus']);
    Route::put('/payments/{payment}/status', [PaymentController::class, 'updateStatus']);
    Route::put('/payment-schedules/{schedule}/status', [PaymentScheduleController::class, 'updateStatus']);
});

// All roles can view - super_admin, admin, viewer
Route::middleware(['auth:sanctum', 'role:super_admin,admin,viewer'])->group(function () {
    Route::get('/clients', [ClientController::class, 'index']);
    Route::get('/clients/{client}', [ClientController::class, 'show']);
    Route::get('/projects', [ProjectController::class, 'index']);
    Route::get('/projects/{project}', [ProjectController::class, 'show']);
    Route::get('/payments', [PaymentController::class, 'index']);
    Route::get('/payments/{payment}', [PaymentController::class, 'show']);
    Route::get('/transactions', [PaymentTransactionController::class, 'index']);
    Route::get('/client-projects', [ClientsProjectController::class, 'projectsWithClients']);
    Route::get('/clients/{client}/projects', [ClientsProjectController::class, 'index']);
});
