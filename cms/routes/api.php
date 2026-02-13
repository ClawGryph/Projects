<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\ProjectController;
use App\Http\Controllers\Api\UserProjectController;

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

Route::apiResource('/users', UserController::class);
Route::apiResource('/projects', ProjectController::class);
Route::get('/users/{user}/projects', [UserProjectController::class, 'index']);
Route::post('/users/{user}/projects', [UserProjectController::class, 'assignProject']);
Route::get('/client-projects', [UserProjectController::class, 'projectsWithClients']);
Route::put('/projects/{project}/status', [ProjectController::class, 'updateStatus']);