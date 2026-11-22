from pydantic import BaseModel


class TokenCreated(BaseModel):
    access_hash: str


class ContactOut(BaseModel):
    name: str
    phone_number: str
    relationship: str | None = None


class HelperProfile(BaseModel):
    """Everything a Helper is allowed to see. Deliberately has no email, user id or token fields."""

    full_name: str | None = None
    country_of_origin: str | None = None
    country_of_residence: str | None = None
    medical_info: str | None = None
    custom_notes: str | None = None
    contacts: list[ContactOut] = []
