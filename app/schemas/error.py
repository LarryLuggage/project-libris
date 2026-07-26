from pydantic import BaseModel, Field


class ErrorResponse(BaseModel):
    """Standard error response returned by all error handlers."""

    detail: str = Field(..., description="Human-readable error message")
    error_code: str = Field(..., description="Machine-readable error code")
