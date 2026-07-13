package stirling.software.proprietary.security.model.api.user;

import io.swagger.v3.oas.annotations.media.Schema;

import lombok.Data;

@Data
public class ResetPasswordRequest {

    @Schema(
            description = "Password reset token from the emailed link",
            requiredMode = Schema.RequiredMode.REQUIRED)
    private String token;

    @Schema(
            description = "The new password to set",
            format = "password",
            requiredMode = Schema.RequiredMode.REQUIRED)
    private String newPassword;
}
