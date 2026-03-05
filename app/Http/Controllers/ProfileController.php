<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class ProfileController extends Controller
{
    public function update(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'avatar' => ['nullable', 'image', 'max:1024'], // 1MB Max
        ]);

        $user->name = $request->name;

        if ($request->hasFile('avatar')) {
            // Delete old avatar if exists and not default
            if ($user->avatar) {
                Storage::disk('public')->delete($user->avatar);
            }
            $path = $request->file('avatar')->store('avatars', 'public');
            $user->avatar = $path;
        }

        $user->save();

        return response()->json([
            'message' => 'Profile updated successfully.',
            'user' => $user,
        ]);
    }

    public function updatePassword(Request $request)
    {
        $request->validate([
            'current_password' => ['required', 'current_password'],
            'password' => ['required', 'confirmed', 'min:6'],
        ]);

        $request->user()->update([
            'password' => Hash::make($request->password),
        ]);

        return response()->json([
            'message' => 'Password updated successfully.',
        ]);
    }

    public function updateEmail(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
        ]);

        if ($user->hasVerifiedEmail() && $request->email === $user->email) {
            return response()->json([
                'message' => 'Email is already verified and up to date.',
                'user' => $user,
                'email_changed' => false,
            ]);
        }

        if ($request->email !== $user->email) {
            $user->email = $request->email;
            $user->email_verified_at = null;
            $user->save();
            
            $user->sendEmailVerificationNotification();

            return response()->json([
                'message' => 'Email updated. Please verify your new email address.',
                'user' => $user,
                'email_changed' => true,
            ]);
        }

        return response()->json([
            'message' => 'Email is already up to date.',
            'user' => $user,
            'email_changed' => false,
        ]);
    }
}
