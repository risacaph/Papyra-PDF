package stirling.software.proprietary.security.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import stirling.software.proprietary.security.model.LicenseKey;

/** Persistence for admin-generated, user-redeemable {@link LicenseKey} rows. */
@Repository
public interface LicenseKeyRepository extends JpaRepository<LicenseKey, Long> {

    Optional<LicenseKey> findByCode(String code);

    boolean existsByCode(String code);

    List<LicenseKey> findAllByOrderByCreatedAtDesc();
}
