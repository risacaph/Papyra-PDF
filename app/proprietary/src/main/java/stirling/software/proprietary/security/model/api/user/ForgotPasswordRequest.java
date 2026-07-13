package stirling.software.proprietary.security.model.api.user;

import io.swagger.v3.oas.annotations.media.Schema;

import lombok.Data;

@Data
public class ForgotPasswordRequest {

    @Schema(
            description = "Email address of the account to send a reset link to",
            requiredMode = Schema.RequiredMode.REQUIRED)
    private String email;
}
