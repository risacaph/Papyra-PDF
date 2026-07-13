package stirling.software.proprietary.security.controller.api;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import io.swagger.v3.oas.annotations.Operation;

import jakarta.servlet.http.HttpServletRequest;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import stirling.software.common.annotations.api.UserApi;
import stirling.software.common.model.ApplicationProperties;
import stirling.software.proprietary.security.model.api.user.ForgotPasswordRequest;
import stirling.software.proprietary.security.model.api.user.ResetPasswordRequest;
import stirling.software.proprietary.security.service.PasswordResetService;

/**
 * Public endpoints for the self-service password reset flow. All three are anonymous (whitelisted
 * in {@code RequestUriUtils.isPublicAuthEndpoint}). The request endpoint always returns a generic
 * success so it never reveals whether an account exists.
 */
@Slf4j
@UserApi
@RequiredArgsConstructor
public class PasswordResetController {

    private final PasswordResetService passwordResetService;
    private final ApplicationProperties applicationProperties;

    @Operation(
            summary = "Request a password reset email",
            description =
                    "Emails a reset link to the address if a matching local account exists. Always"
                            + " returns a generic success so account existence is never revealed.")
    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(
            @RequestBody ForgotPasswordRequest requestBody, HttpServletRequest request) {
        passwordResetService.requestReset(requestBody.getEmail(), resolveBaseUrl(request));
        return ResponseEntity.ok(
                Map.of(
                        "message",
                        "If an account with that email exists, a password reset link has been"
                                + " sent."));
    }

    @Operation(
            summary = "Check whether a password reset token is still valid",
            description = "Used by the reset page to show an expired/invalid state before submit.")
    @GetMapping("/reset-password/validate/{token}")
    public ResponseEntity<Map<String, Boolean>> validateResetToken(@PathVariable String token) {
        return ResponseEntity.ok(Map.of("valid", passwordResetService.isTokenValid(token)));
    }

    @Operation(
            summary = "Set a new password using a reset token",
            description = "Consumes a single-use token and updates the account password.")
    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(
            @RequestBody ResetPasswordRequest requestBody) {
        try {
            boolean ok =
                    passwordResetService.resetPassword(
                            requestBody.getToken(), requestBody.getNewPassword());
            if (!ok) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "This reset link is invalid or has expired."));
            }
            return ResponseEntity.ok(
                    Map.of("message", "Your password has been reset. Please sign in."));
        } catch (Exception e) {
            log.error("Password reset failed", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Unable to reset password. Please try again."));
        }
    }

    /**
     * Base URL for the reset link, matching the invite-link resolution order: configured frontend
     * URL, then backend URL, then the incoming request. Trailing slash stripped.
     */
    private String resolveBaseUrl(HttpServletRequest request) {
        String configuredFrontendUrl = applicationProperties.getSystem().getFrontendUrl();
        String configuredBackendUrl = applicationProperties.getSystem().getBackendUrl();
        String baseUrl;
        if (configuredFrontendUrl != null && !configuredFrontendUrl.trim().isEmpty()) {
            baseUrl = configuredFrontendUrl.trim();
        } else if (configuredBackendUrl != null && !configuredBackendUrl.trim().isEmpty()) {
            baseUrl = configuredBackendUrl.trim();
        } else {
            baseUrl =
                    request.getScheme()
                            + "://"
                            + request.getServerName()
                            + (request.getServerPort() != 80 && request.getServerPort() != 443
                                    ? ":" + request.getServerPort()
                                    : "");
        }
        if (baseUrl.endsWith("/")) {
            baseUrl = baseUrl.substring(0, baseUrl.length() - 1);
        }
        return baseUrl;
    }
}
