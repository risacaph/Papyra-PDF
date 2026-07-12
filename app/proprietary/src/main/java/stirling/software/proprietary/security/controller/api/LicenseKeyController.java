package stirling.software.proprietary.security.controller.api;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

import lombok.RequiredArgsConstructor;

import stirling.software.proprietary.security.model.LicenseKey;
import stirling.software.proprietary.security.model.LicenseTier;
import stirling.software.proprietary.security.model.User;
import stirling.software.proprietary.security.service.LicenseKeyService;
import stirling.software.proprietary.security.service.UserService;

/**
 * Admin generation and user redemption of distributable license keys. Admins mint and manage keys;
 * any signed-in user can redeem a code to activate or upgrade their access plan.
 */
@RestController
@RequestMapping("/api/v1/user/license-keys")
@RequiredArgsConstructor
@Tag(name = "License keys", description = "Generate and redeem distributable license keys.")
public class LicenseKeyController {

    private final LicenseKeyService licenseKeyService;
    private final UserService userService;

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    @Operation(
            summary = "List license keys",
            description = "Returns all generated license keys (admin only).")
    public ResponseEntity<List<LicenseKeyView>> list() {
        List<LicenseKeyView> keys =
                licenseKeyService.list().stream().map(LicenseKeyView::from).toList();
        return ResponseEntity.ok(keys);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    @Operation(
            summary = "Generate a license key",
            description =
                    "Mints a key for a tier with an optional custom duration and redemption count"
                            + " (admin only).")
    public ResponseEntity<?> generate(
            @RequestParam(name = "tier") String tier,
            @RequestParam(name = "durationMonths", required = false) String durationMonths,
            @RequestParam(name = "maxRedemptions", required = false, defaultValue = "1")
                    int maxRedemptions,
            @RequestParam(name = "label", required = false) String label,
            Principal principal) {
        Integer months;
        try {
            months =
                    (durationMonths == null || durationMonths.isBlank())
                            ? null
                            : Integer.valueOf(durationMonths.trim());
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Duration must be a whole number of months, or empty."));
        }
        try {
            LicenseKey key =
                    licenseKeyService.generate(
                            LicenseTier.fromString(tier),
                            months,
                            maxRedemptions,
                            label,
                            principal == null ? null : principal.getName());
            return ResponseEntity.ok(LicenseKeyView.from(key));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    @Operation(
            summary = "Revoke a license key",
            description = "Deletes a license key (admin only).")
    public ResponseEntity<?> revoke(@PathVariable("id") long id) {
        if (!licenseKeyService.revoke(id)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "License key not found"));
        }
        return ResponseEntity.ok(Map.of("message", "License key revoked"));
    }

    @PreAuthorize("!hasAuthority('ROLE_DEMO_USER')")
    @PostMapping("/redeem")
    @Operation(
            summary = "Redeem a license key",
            description = "Applies a key's tier and duration to the current user's account.")
    public ResponseEntity<?> redeem(@RequestParam(name = "code") String code, Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        Optional<User> userOpt = userService.findByUsernameIgnoreCase(principal.getName());
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
        try {
            LicenseKeyService.RedemptionOutcome outcome =
                    licenseKeyService.redeem(userOpt.get(), code);
            return ResponseEntity.ok(
                    Map.of(
                            "message",
                            "License key redeemed",
                            "tier",
                            outcome.tier().name(),
                            "expiresAt",
                            String.valueOf(outcome.expiresAt())));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /** A license key as shown to admins. */
    private record LicenseKeyView(
            Long id,
            String code,
            String tier,
            Integer durationMonths,
            int maxRedemptions,
            int redemptionCount,
            String label,
            String createdBy,
            LocalDateTime createdAt,
            LocalDateTime lastRedeemedAt,
            boolean exhausted) {

        static LicenseKeyView from(LicenseKey key) {
            return new LicenseKeyView(
                    key.getId(),
                    key.getCode(),
                    key.getTier(),
                    key.getDurationMonths(),
                    key.getMaxRedemptions(),
                    key.getRedemptionCount(),
                    key.getLabel(),
                    key.getCreatedBy(),
                    key.getCreatedAt(),
                    key.getLastRedeemedAt(),
                    key.isExhausted());
        }
    }
}
