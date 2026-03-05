<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Config;

class CloudStorageServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        try {
            \Illuminate\Support\Facades\Storage::extend('google', function($app, $config) {
                $client = new \Google\Client();
                $client->setClientId($config['clientId']);
                $client->setClientSecret($config['clientSecret']);
                $client->refreshToken($config['refreshToken']);
                $service = new \Google\Service\Drive($client);
                $options = [];
                if (!empty($config['folderId'])) {
                    $options['sharedFolderId'] = $config['folderId'];
                }
                $adapter = new \Masbug\Flysystem\GoogleDriveAdapter($service, null, $options);
                return new \Illuminate\Filesystem\FilesystemAdapter(
                    new \League\Flysystem\Filesystem($adapter, $config),
                    $adapter,
                    $config
                );
            });

            if (Schema::hasTable('storage_settings')) {
                $active = DB::table('storage_settings')->where('is_active', true)->first();
                if ($active && $active->provider !== 'local') {
                    $creds = json_decode($active->credentials, true) ?? [];
                    if ($active->provider === 's3') {
                        Config::set('filesystems.disks.s3', [
                            'driver' => 's3',
                            'key' => $creds['key'] ?? '',
                            'secret' => $creds['secret'] ?? '',
                            'region' => $creds['region'] ?? '',
                            'bucket' => $creds['bucket'] ?? '',
                            'url' => !empty($creds['url']) ? $creds['url'] : null,
                            'endpoint' => !empty($creds['endpoint']) ? $creds['endpoint'] : null,
                            'use_path_style_endpoint' => !empty($creds['use_path_style_endpoint']),
                            'throw' => true,
                        ]);
                    } elseif ($active->provider === 'gdrive') {
                        Config::set('filesystems.disks.gdrive', [
                            'driver' => 'google',
                            'clientId' => $creds['clientId'] ?? '',
                            'clientSecret' => $creds['clientSecret'] ?? '',
                            'refreshToken' => $creds['refreshToken'] ?? '',
                            'folderId' => $creds['folderId'] ?? '',
                            'visibility' => 'public',
                        ]);
                    }
                }
            }
        } catch (\Exception $e) {
            // Ignore DB errors during migrations or initial setup
        }
    }
}
