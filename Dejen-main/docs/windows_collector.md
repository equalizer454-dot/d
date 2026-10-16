# Windows Security Event Collector

`collectors.agent.collectors.windows.WindowsEventCollector` queries the local Windows Security log with PowerShell `Get-WinEvent` and emits DEJEN normalized events. The default IDs cover logons (`4624`, `4625`), user creation/deletion (`4720`, `4726`), and group membership changes (`4728`, `4729`, `4732`, `4733`). Account names, source IPs, event time, computer, record ID, provider, and the original event data are retained when present.

## Install and run

Run in an elevated PowerShell session on a supported Windows host. From the repository root:

```powershell
py -m pip install -r requirements.txt
Copy-Item .env.example .env -ErrorAction SilentlyContinue
$env:WINDOWS_EVENT_COLLECTION_INTERVAL = "10"
py -m collectors.agent.collectors.windows
```

The example copy does not replace an existing `.env`. Set `REDPANDA_BROKERS` and `REDPANDA_TOPIC` to a reachable Redpanda cluster before running. `WINDOWS_EVENT_IDS` accepts comma-separated IDs. `WINDOWS_EVENT_COLLECTION_INTERVAL` sets the query window and polling interval in seconds. Repeated records keep a deterministic UUID based on computer, record ID, and event ID.

## Test and troubleshoot

```sh
python -m unittest tests/test_windows_collector.py -v
```

Access denied usually means the process lacks permission to read the Security log. PowerShell missing or unavailable logs are reported as collection errors. Malformed records and records without timestamps are logged and skipped. The runtime keeps failed deliveries in memory and retries them; stopping with pending events is reported, but the queue is not durable across process crashes.