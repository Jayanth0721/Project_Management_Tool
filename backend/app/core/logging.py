import logging
import sys

try:
    import structlog

    _HAS_STRUCTLOG = True
except ImportError:
    _HAS_STRUCTLOG = False


def configure_logging(level: str = "INFO"):
    if _HAS_STRUCTLOG:
        structlog.configure(
            processors=[
                structlog.stdlib.filter_by_level,
                structlog.stdlib.add_logger_name,
                structlog.stdlib.add_log_level,
                structlog.processors.TimeStamper(fmt="iso"),
                structlog.dev.ConsoleRenderer() if sys.stderr.isatty() else structlog.processors.JSONRenderer(),
            ],
            context_class=dict,
            logger_factory=structlog.stdlib.LoggerFactory(),
            cache_logger_on_first_use=True,
        )
        root_logger = logging.getLogger()
        root_logger.setLevel(level.upper())
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(structlog.stdlib.ProcessorFormatter(
            processor=structlog.processors.JSONRenderer(),
            foreign_pre_chain=[
                structlog.stdlib.add_log_level,
                structlog.processors.TimeStamper(fmt="iso"),
            ],
        ))
        root_logger.addHandler(handler)
    else:
        logging.basicConfig(
            level=level.upper(),
            format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
            datefmt="%Y-%m-%dT%H:%M:%S%z",
            stream=sys.stdout,
        )
