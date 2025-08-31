package dev.killua.dashboard.repository;

import dev.killua.dashboard.entity.DiscordToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface DiscordTokenRepository extends JpaRepository<DiscordToken, String> {
    
    /**
     * Find Discord token by JWT token
     */
    Optional<DiscordToken> findByJwtToken(String jwtToken);
    
    /**
     * Find Discord token by Discord ID
     */
    Optional<DiscordToken> findByDiscordId(String discordId);
    
    /**
     * Find all expired tokens
     */
    @Query("SELECT dt FROM DiscordToken dt WHERE dt.expiresAt < :now")
    List<DiscordToken> findExpiredTokens(@Param("now") LocalDateTime now);
    
    /**
     * Delete expired tokens
     */
    @Modifying
    @Query("DELETE FROM DiscordToken dt WHERE dt.expiresAt < :now")
    void deleteExpiredTokens(@Param("now") LocalDateTime now);
    
    /**
     * Delete token by JWT token
     */
    @Modifying
    @Query("DELETE FROM DiscordToken dt WHERE dt.jwtToken = :jwtToken")
    void deleteByJwtToken(@Param("jwtToken") String jwtToken);
}
