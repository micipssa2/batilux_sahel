from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=200)


class LoginStepResponse(BaseModel):
    """Réponse à l'étape mot de passe. Jamais de token de session ici —
    seulement un token intermédiaire pour l'étape suivante (setup ou
    vérification TOTP).
    """

    requires_totp_setup: bool
    pre_auth_token: str


class TOTPSetupResponse(BaseModel):
    secret: str
    qr_code_data_uri: str
    backup_codes: list[str]


class TOTPConfirmRequest(BaseModel):
    code: str = Field(min_length=6, max_length=6, pattern=r"^\d{6}$")


class TOTPVerifyRequest(BaseModel):
    code: str | None = Field(default=None, pattern=r"^\d{6}$")
    backup_code: str | None = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class MeResponse(BaseModel):
    id: int
    email: str
    totp_enabled: bool
