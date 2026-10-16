import logging
import os
import signal
import threading

from dotenv import load_dotenv

from collectors.fim.monitor import FIMMonitor
from collectors.sender.kafka import KafkaEventProducer


def main() -> int:
    load_dotenv()
    if os.getenv("FIM_ENABLED", "true").lower() not in {"1", "true", "yes", "on"}:
        logging.info("FIM is disabled")
        return 0

    paths = [item.strip() for item in os.getenv("FIM_PATHS", "").split(",") if item.strip()]
    if not paths:
        raise ValueError("Set FIM_PATHS to one or more files or directories")
    exclusions = tuple(
        item.strip()
        for item in os.getenv("FIM_EXCLUDE_PATTERNS", "").split(",")
        if item.strip()
    )
    producer = KafkaEventProducer()
    monitor = FIMMonitor(
        paths,
        os.getenv("FIM_BASELINE_PATH", "./data/fim_baseline.json"),
        on_event=producer.send_event,
        agent_id=os.getenv("COLLECTOR_AGENT_ID"),
        host=os.getenv("COLLECTOR_HOST"),
        exclusions=exclusions,
        interval_seconds=float(os.getenv("FIM_SCAN_INTERVAL_SECONDS", "5")),
    )
    stop_event = threading.Event()
    signal.signal(signal.SIGINT, lambda *_args: stop_event.set())
    signal.signal(signal.SIGTERM, lambda *_args: stop_event.set())
    try:
        monitor.run(stop_event)
    finally:
        producer.close()
    return 0


if __name__ == "__main__":
    logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
    raise SystemExit(main())