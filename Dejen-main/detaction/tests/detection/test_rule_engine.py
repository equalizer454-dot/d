import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from datetime import datetime, timedelta, timezone
import uuid

from detection.main import DetectionService


def make_event(event_type, source_ip, ts, **kwargs):
    e = {
        "event_id": str(uuid.uuid4()),
        "timestamp": ts.isoformat(),
        "agent_id": "agent-001",
        "host": "ubuntu-01",
        "event_type": event_type,
        "username": "admin",
        "source_ip": source_ip,
        "message": "test event",
        "severity": "LOW",
    }
    e.update(kwargs)
    return e


def test_brute_force_fires_after_5_failed_logins():
    service = DetectionService()
    start = datetime.now(timezone.utc)
    fired = []
    for i in range(5):
        ts = start + timedelta(seconds=i * 10)  # all within 5 min window
        event = make_event("authentication_failed", "10.0.0.99", ts)
        alerts = service.process_event(event)
        fired.extend(alerts)

    brute_force_alerts = [a for a in fired if a["rule_id"] == "brute_force"]
    assert len(brute_force_alerts) == 1, f"expected exactly 1 brute force alert, got {len(brute_force_alerts)}"
    assert brute_force_alerts[0]["severity"] == "HIGH"
    assert len(brute_force_alerts[0]["related_event_ids"]) == 5


def test_malware_event_fires_single_event_rule():
    service = DetectionService()
    event = make_event("malware_detected", "10.0.0.5", datetime.now(timezone.utc))
    alerts = service.process_event(event)
    assert any(a["rule_id"] == "malware" for a in alerts)
    malware_alert = [a for a in alerts if a["rule_id"] == "malware"][0]
    assert malware_alert["severity"] == "CRITICAL"


def test_fewer_than_threshold_does_not_fire():
    service = DetectionService()
    start = datetime.now(timezone.utc)
    fired = []
    for i in range(3):  # below threshold of 5
        ts = start + timedelta(seconds=i * 10)
        event = make_event("authentication_failed", "10.0.0.50", ts)
        fired.extend(service.process_event(event))
    assert not any(a["rule_id"] == "brute_force" for a in fired)


def test_reputation_enrichment_escalates_severity():
    def fake_enrich(event):
        return {"ip_score": 95, "is_known_malicious": True, "source": "test"}

    service = DetectionService(enrich_fn=fake_enrich)
    event = make_event("malware_detected", "45.155.205.233", datetime.now(timezone.utc))
    alerts = service.process_event(event)
    malware_alert = [a for a in alerts if a["rule_id"] == "malware"][0]
    # CRITICAL is already max, so it stays CRITICAL, but confidence should be boosted
    assert malware_alert["confidence"] >= 0.9


if __name__ == "__main__":
    test_brute_force_fires_after_5_failed_logins()
    test_malware_event_fires_single_event_rule()
    test_fewer_than_threshold_does_not_fire()
    test_reputation_enrichment_escalates_severity()
    print("detection tests passed")
