<?php

namespace App\Traits;

use App\Models\SystemActivityLog;
use Illuminate\Support\Facades\Auth;

trait LogsSystemActivity
{
    /**
     * Boot the trait and register observers for creation, updating, and deleting.
     */
    protected static function bootLogsSystemActivity()
    {
        static::created(function ($model) {
            $model->logSystemActivity('created');
        });

        static::updated(function ($model) {
            $model->logSystemActivity('updated');
        });

        static::deleted(function ($model) {
            $model->logSystemActivity('deleted');
        });
    }

    /**
     * Actually write the log to the database.
     */
    public function logSystemActivity(string $event)
    {
        // Don't log if we're running in console (e.g., migrations/seeds) unless explicitly desired
        // but we'll try to get the causer if possible
        $causer = Auth::check() ? Auth::user() : null;

        $properties = [];

        if ($event === 'updated') {
            $properties = [
                'attributes' => $this->getDirty(),
                'old'        => array_intersect_key($this->getOriginal(), $this->getDirty()),
            ];
        } else if ($event === 'created') {
            $properties = [
                'attributes' => $this->getAttributes(),
            ];
        } else if ($event === 'deleted') {
            $properties = [
                'old' => $this->getOriginal(),
            ];
        }

        SystemActivityLog::create([
            'log_name'     => 'default',
            'description'  => "{$event} {$this->getSystemActivitySubjectDescription()}",
            'subject_type' => get_class($this),
            'subject_id'   => $this->getKey(),
            'event'        => $event,
            'causer_type'  => $causer ? get_class($causer) : null,
            'causer_id'    => $causer ? $causer->getKey() : null,
            'properties'   => $properties,
        ]);
    }

    /**
     * Get a descriptive name for the model (e.g. Customer, Order #123)
     */
    protected function getSystemActivitySubjectDescription(): string
    {
        $className = class_basename($this);
        return strtolower($className);
    }
}
