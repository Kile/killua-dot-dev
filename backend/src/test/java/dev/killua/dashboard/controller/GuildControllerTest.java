package dev.killua.dashboard.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import dev.killua.dashboard.dto.UserDto;
import dev.killua.dashboard.service.AuthService;
import dev.killua.dashboard.service.DiscordTokenService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.time.Instant;
import java.util.List;
import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("unchecked")
class GuildControllerTest {

    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private AuthService authService;

    @Mock
    private DiscordTokenService discordTokenService;

    @Mock
    private RestTemplate restTemplate;

    @InjectMocks
    private GuildController guildController;

    private static final String GUILD_ID = "123456789012345678";
    private static final String JWT_TOKEN = "jwt-token";
    private static final String DISCORD_TOKEN = "discord-secret-token";

    @BeforeEach
    void setup() {
        mockMvc = MockMvcBuilders.standaloneSetup(guildController).build();
        ReflectionTestUtils.setField(guildController, "objectMapper", objectMapper);
        ReflectionTestUtils.setField(guildController, "externalApiBaseUrl", "https://api.example.com");
    }

    private UserDto buildUser() {
        UserDto user = new UserDto();
        user.setDiscordId("1234567890");
        user.setUsername("testuser");
        user.setDiscriminator("0001");
        user.setAvatar("avatarhash");
        user.setEmail("test@example.com");
        user.setCreatedAt(LocalDateTime.now().minusDays(10));
        user.setLastLogin(LocalDateTime.now());
        user.setPremium(true);
        user.setPremiumTier("tier_1");
        user.setPremiumExpires(LocalDateTime.now().plusDays(30));
        return user;
    }

    // ==================== GET /{guildId}/info Tests ====================

    @Test
    @DisplayName("GET /api/guild/{id}/info - missing header returns 400")
    void getGuildInfo_missingHeader_returnsBadRequest() throws Exception {
        mockMvc.perform(get("/api/guild/" + GUILD_ID + "/info"))
            .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("GET /api/guild/{id}/info - invalid header returns 400")
    void getGuildInfo_invalidHeader_returnsBadRequest() throws Exception {
        mockMvc.perform(get("/api/guild/" + GUILD_ID + "/info")
                .header("Authorization", "InvalidToken"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error", containsString("Invalid authorization header")));
    }

    @Test
    @DisplayName("GET /api/guild/{id}/info - discord token not found returns 404")
    void getGuildInfo_discordTokenNotFound_returns404() throws Exception {
        Mockito.when(authService.verifyToken(eq(JWT_TOKEN))).thenReturn(buildUser());
        Mockito.when(discordTokenService.getDiscordToken(eq(JWT_TOKEN))).thenReturn(null);

        mockMvc.perform(get("/api/guild/" + GUILD_ID + "/info")
                .header("Authorization", "Bearer " + JWT_TOKEN))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.error", containsString("Discord token not found")));
    }

    @Test
    @DisplayName("GET /api/guild/{id}/info - success returns guild info")
    void getGuildInfo_success() throws Exception {
        Mockito.when(authService.verifyToken(eq(JWT_TOKEN))).thenReturn(buildUser());
        Mockito.when(discordTokenService.getDiscordToken(eq(JWT_TOKEN))).thenReturn(DISCORD_TOKEN);

        String guildInfoJson = objectMapper.writeValueAsString(Map.of(
            "badges", List.of("early_supporter", "developer"),
            "approximate_member_count", 150,
            "name", "Test Guild",
            "icon_url", "https://cdn.discordapp.com/icons/123/icon.png",
            "prefix", "!",
            "is_premium", true,
            "bot_added_on", "2024-01-01T00:00:00Z",
            "tags", List.of(
                Map.of(
                    "name", "test-tag",
                    "content", "Test content",
                    "uses", 5,
                    "created_at", "2024-06-01T12:00:00Z",
                    "owner", Map.of(
                        "user_id", 1234567890L,
                        "display_name", "TestUser",
                        "avatar_url", "https://example.com/avatar.png"
                    )
                )
            )
        ));

        Mockito.when(restTemplate.exchange(
            contains("/guild/" + GUILD_ID + "/info"),
            eq(HttpMethod.GET),
            org.mockito.ArgumentMatchers.<HttpEntity<?>>any(),
            eq(String.class)
        )).thenReturn(new ResponseEntity<>(guildInfoJson, HttpStatus.OK));

        mockMvc.perform(get("/api/guild/" + GUILD_ID + "/info")
                .header("Authorization", "Bearer " + JWT_TOKEN))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.badges", hasSize(2)))
            .andExpect(jsonPath("$.prefix", is("!")))
            .andExpect(jsonPath("$.is_premium", is(true)))
            .andExpect(jsonPath("$.tags", hasSize(1)))
            .andExpect(jsonPath("$.tags[0].name", is("test-tag")));
    }

    @Test
    @DisplayName("GET /api/guild/{id}/info - external API error returns error status")
    void getGuildInfo_externalApiError_returnsError() throws Exception {
        Mockito.when(authService.verifyToken(eq(JWT_TOKEN))).thenReturn(buildUser());
        Mockito.when(discordTokenService.getDiscordToken(eq(JWT_TOKEN))).thenReturn(DISCORD_TOKEN);

        Mockito.when(restTemplate.exchange(
            contains("/guild/" + GUILD_ID + "/info"),
            eq(HttpMethod.GET),
            org.mockito.ArgumentMatchers.<HttpEntity<?>>any(),
            eq(String.class)
        )).thenReturn(new ResponseEntity<>("", HttpStatus.INTERNAL_SERVER_ERROR));

        mockMvc.perform(get("/api/guild/" + GUILD_ID + "/info")
                .header("Authorization", "Bearer " + JWT_TOKEN))
            .andExpect(status().isInternalServerError())
            .andExpect(jsonPath("$.error", containsString("Failed to fetch guild info")));
    }

    // ==================== PUT /{guildId}/edit Tests ====================

    @Test
    @DisplayName("POST /api/guild/{id}/edit - missing header returns 400")
    void editGuildSettings_missingHeader_returnsBadRequest() throws Exception {
        mockMvc.perform(post("/api/guild/" + GUILD_ID + "/edit")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("prefix", "?"))))
            .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/guild/{id}/edit - discord token not found returns 404")
    void editGuildSettings_discordTokenNotFound_returns404() throws Exception {
        Mockito.when(authService.verifyToken(eq(JWT_TOKEN))).thenReturn(buildUser());
        Mockito.when(discordTokenService.getDiscordToken(eq(JWT_TOKEN))).thenReturn(null);

        mockMvc.perform(post("/api/guild/" + GUILD_ID + "/edit")
                .header("Authorization", "Bearer " + JWT_TOKEN)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("prefix", "?"))))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.error", containsString("Discord token not found")));
    }

    @Test
    @DisplayName("POST /api/guild/{id}/edit - success returns success message")
    void editGuildSettings_success() throws Exception {
        Mockito.when(authService.verifyToken(eq(JWT_TOKEN))).thenReturn(buildUser());
        Mockito.when(discordTokenService.getDiscordToken(eq(JWT_TOKEN))).thenReturn(DISCORD_TOKEN);

        Mockito.when(restTemplate.exchange(
            contains("/guild/" + GUILD_ID + "/edit"),
            eq(HttpMethod.POST),
            org.mockito.ArgumentMatchers.<HttpEntity<?>>any(),
            eq(String.class)
        )).thenReturn(new ResponseEntity<>("{\"success\": true}", HttpStatus.OK));

        mockMvc.perform(post("/api/guild/" + GUILD_ID + "/edit")
                .header("Authorization", "Bearer " + JWT_TOKEN)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("prefix", "?"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success", is(true)))
            .andExpect(jsonPath("$.message", containsString("Guild settings updated successfully")));
    }

    // ==================== POST /{guildId}/tag/create Tests ====================

    @Test
    @DisplayName("POST /api/guild/{id}/tag/create - missing header returns 400")
    void createTag_missingHeader_returnsBadRequest() throws Exception {
        mockMvc.perform(post("/api/guild/" + GUILD_ID + "/tag/create")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("name", "test", "content", "content"))))
            .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/guild/{id}/tag/create - discord token not found returns 404")
    void createTag_discordTokenNotFound_returns404() throws Exception {
        Mockito.when(authService.verifyToken(eq(JWT_TOKEN))).thenReturn(buildUser());
        Mockito.when(discordTokenService.getDiscordToken(eq(JWT_TOKEN))).thenReturn(null);

        mockMvc.perform(post("/api/guild/" + GUILD_ID + "/tag/create")
                .header("Authorization", "Bearer " + JWT_TOKEN)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("name", "test", "content", "content"))))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.error", containsString("Discord token not found")));
    }

    @Test
    @DisplayName("POST /api/guild/{id}/tag/create - success returns success response")
    void createTag_success() throws Exception {
        Mockito.when(authService.verifyToken(eq(JWT_TOKEN))).thenReturn(buildUser());
        Mockito.when(discordTokenService.getDiscordToken(eq(JWT_TOKEN))).thenReturn(DISCORD_TOKEN);

        String responseJson = objectMapper.writeValueAsString(Map.of(
            "success", true,
            "message", "Tag created successfully"
        ));

        Mockito.when(restTemplate.exchange(
            contains("/guild/" + GUILD_ID + "/tag/create"),
            eq(HttpMethod.POST),
            org.mockito.ArgumentMatchers.<HttpEntity<?>>any(),
            eq(String.class)
        )).thenReturn(new ResponseEntity<>(responseJson, HttpStatus.OK));

        mockMvc.perform(post("/api/guild/" + GUILD_ID + "/tag/create")
                .header("Authorization", "Bearer " + JWT_TOKEN)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("name", "test-tag", "content", "Test content"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success", is(true)))
            .andExpect(jsonPath("$.message", is("Tag created successfully")));
    }

    @Test
    @DisplayName("POST /api/guild/{id}/tag/create - failure returns error")
    void createTag_failure_returnsError() throws Exception {
        Mockito.when(authService.verifyToken(eq(JWT_TOKEN))).thenReturn(buildUser());
        Mockito.when(discordTokenService.getDiscordToken(eq(JWT_TOKEN))).thenReturn(DISCORD_TOKEN);

        String responseJson = objectMapper.writeValueAsString(Map.of(
            "success", false,
            "message", "Tag already exists"
        ));

        Mockito.when(restTemplate.exchange(
            contains("/guild/" + GUILD_ID + "/tag/create"),
            eq(HttpMethod.POST),
            org.mockito.ArgumentMatchers.<HttpEntity<?>>any(),
            eq(String.class)
        )).thenReturn(new ResponseEntity<>(responseJson, HttpStatus.OK));

        mockMvc.perform(post("/api/guild/" + GUILD_ID + "/tag/create")
                .header("Authorization", "Bearer " + JWT_TOKEN)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("name", "existing-tag", "content", "content"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.error", is("Tag already exists")));
    }

    // ==================== POST /{guildId}/tag/edit Tests ====================

    @Test
    @DisplayName("POST /api/guild/{id}/tag/edit - missing header returns 400")
    void editTag_missingHeader_returnsBadRequest() throws Exception {
        mockMvc.perform(post("/api/guild/" + GUILD_ID + "/tag/edit")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("name", "test", "content", "new content"))))
            .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/guild/{id}/tag/edit - success with content update")
    void editTag_contentUpdate_success() throws Exception {
        Mockito.when(authService.verifyToken(eq(JWT_TOKEN))).thenReturn(buildUser());
        Mockito.when(discordTokenService.getDiscordToken(eq(JWT_TOKEN))).thenReturn(DISCORD_TOKEN);

        String responseJson = objectMapper.writeValueAsString(Map.of(
            "success", true,
            "message", "Tag updated successfully"
        ));

        Mockito.when(restTemplate.exchange(
            contains("/guild/" + GUILD_ID + "/tag/edit"),
            eq(HttpMethod.POST),
            org.mockito.ArgumentMatchers.<HttpEntity<?>>any(),
            eq(String.class)
        )).thenReturn(new ResponseEntity<>(responseJson, HttpStatus.OK));

        mockMvc.perform(post("/api/guild/" + GUILD_ID + "/tag/edit")
                .header("Authorization", "Bearer " + JWT_TOKEN)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("name", "test-tag", "content", "Updated content"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success", is(true)))
            .andExpect(jsonPath("$.message", is("Tag updated successfully")));
    }

    @Test
    @DisplayName("POST /api/guild/{id}/tag/edit - success with name change")
    void editTag_nameChange_success() throws Exception {
        Mockito.when(authService.verifyToken(eq(JWT_TOKEN))).thenReturn(buildUser());
        Mockito.when(discordTokenService.getDiscordToken(eq(JWT_TOKEN))).thenReturn(DISCORD_TOKEN);

        String responseJson = objectMapper.writeValueAsString(Map.of(
            "success", true,
            "message", "Tag renamed successfully"
        ));

        Mockito.when(restTemplate.exchange(
            contains("/guild/" + GUILD_ID + "/tag/edit"),
            eq(HttpMethod.POST),
            org.mockito.ArgumentMatchers.<HttpEntity<?>>any(),
            eq(String.class)
        )).thenReturn(new ResponseEntity<>(responseJson, HttpStatus.OK));

        mockMvc.perform(post("/api/guild/" + GUILD_ID + "/tag/edit")
                .header("Authorization", "Bearer " + JWT_TOKEN)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("name", "old-tag", "new_name", "new-tag"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success", is(true)));
    }

    @Test
    @DisplayName("POST /api/guild/{id}/tag/edit - success with ownership transfer")
    void editTag_ownershipTransfer_success() throws Exception {
        Mockito.when(authService.verifyToken(eq(JWT_TOKEN))).thenReturn(buildUser());
        Mockito.when(discordTokenService.getDiscordToken(eq(JWT_TOKEN))).thenReturn(DISCORD_TOKEN);

        String responseJson = objectMapper.writeValueAsString(Map.of(
            "success", true,
            "message", "Tag ownership transferred"
        ));

        Mockito.when(restTemplate.exchange(
            contains("/guild/" + GUILD_ID + "/tag/edit"),
            eq(HttpMethod.POST),
            org.mockito.ArgumentMatchers.<HttpEntity<?>>any(),
            eq(String.class)
        )).thenReturn(new ResponseEntity<>(responseJson, HttpStatus.OK));

        mockMvc.perform(post("/api/guild/" + GUILD_ID + "/tag/edit")
                .header("Authorization", "Bearer " + JWT_TOKEN)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("name", "test-tag", "new_owner", "987654321012345678"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success", is(true)));
    }

    @Test
    @DisplayName("POST /api/guild/{id}/tag/edit - not owner returns error")
    void editTag_notOwner_returnsError() throws Exception {
        Mockito.when(authService.verifyToken(eq(JWT_TOKEN))).thenReturn(buildUser());
        Mockito.when(discordTokenService.getDiscordToken(eq(JWT_TOKEN))).thenReturn(DISCORD_TOKEN);

        String responseJson = objectMapper.writeValueAsString(Map.of(
            "success", false,
            "message", "You don't own this tag"
        ));

        Mockito.when(restTemplate.exchange(
            contains("/guild/" + GUILD_ID + "/tag/edit"),
            eq(HttpMethod.POST),
            org.mockito.ArgumentMatchers.<HttpEntity<?>>any(),
            eq(String.class)
        )).thenReturn(new ResponseEntity<>(responseJson, HttpStatus.OK));

        mockMvc.perform(post("/api/guild/" + GUILD_ID + "/tag/edit")
                .header("Authorization", "Bearer " + JWT_TOKEN)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("name", "other-tag", "content", "new content"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.error", is("You don't own this tag")));
    }

    // ==================== DELETE /{guildId}/tag/delete Tests ====================

    @Test
    @DisplayName("DELETE /api/guild/{id}/tag/delete - missing header returns 400")
    void deleteTag_missingHeader_returnsBadRequest() throws Exception {
        mockMvc.perform(delete("/api/guild/" + GUILD_ID + "/tag/delete")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("name", "test"))))
            .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("DELETE /api/guild/{id}/tag/delete - discord token not found returns 404")
    void deleteTag_discordTokenNotFound_returns404() throws Exception {
        Mockito.when(authService.verifyToken(eq(JWT_TOKEN))).thenReturn(buildUser());
        Mockito.when(discordTokenService.getDiscordToken(eq(JWT_TOKEN))).thenReturn(null);

        mockMvc.perform(delete("/api/guild/" + GUILD_ID + "/tag/delete")
                .header("Authorization", "Bearer " + JWT_TOKEN)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("name", "test"))))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.error", containsString("Discord token not found")));
    }

    @Test
    @DisplayName("DELETE /api/guild/{id}/tag/delete - success returns success response")
    void deleteTag_success() throws Exception {
        Mockito.when(authService.verifyToken(eq(JWT_TOKEN))).thenReturn(buildUser());
        Mockito.when(discordTokenService.getDiscordToken(eq(JWT_TOKEN))).thenReturn(DISCORD_TOKEN);

        String responseJson = objectMapper.writeValueAsString(Map.of(
            "success", true,
            "message", "Tag deleted successfully"
        ));

        Mockito.when(restTemplate.exchange(
            contains("/guild/" + GUILD_ID + "/tag/delete"),
            eq(HttpMethod.DELETE),
            org.mockito.ArgumentMatchers.<HttpEntity<?>>any(),
            eq(String.class)
        )).thenReturn(new ResponseEntity<>(responseJson, HttpStatus.OK));

        mockMvc.perform(delete("/api/guild/" + GUILD_ID + "/tag/delete")
                .header("Authorization", "Bearer " + JWT_TOKEN)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("name", "test-tag"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success", is(true)))
            .andExpect(jsonPath("$.message", is("Tag deleted successfully")));
    }

    @Test
    @DisplayName("DELETE /api/guild/{id}/tag/delete - tag not found returns error")
    void deleteTag_notFound_returnsError() throws Exception {
        Mockito.when(authService.verifyToken(eq(JWT_TOKEN))).thenReturn(buildUser());
        Mockito.when(discordTokenService.getDiscordToken(eq(JWT_TOKEN))).thenReturn(DISCORD_TOKEN);

        String responseJson = objectMapper.writeValueAsString(Map.of(
            "success", false,
            "message", "Tag not found"
        ));

        Mockito.when(restTemplate.exchange(
            contains("/guild/" + GUILD_ID + "/tag/delete"),
            eq(HttpMethod.DELETE),
            org.mockito.ArgumentMatchers.<HttpEntity<?>>any(),
            eq(String.class)
        )).thenReturn(new ResponseEntity<>(responseJson, HttpStatus.OK));

        mockMvc.perform(delete("/api/guild/" + GUILD_ID + "/tag/delete")
                .header("Authorization", "Bearer " + JWT_TOKEN)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("name", "nonexistent-tag"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.error", is("Tag not found")));
    }

    @Test
    @DisplayName("DELETE /api/guild/{id}/tag/delete - no permission returns error")
    void deleteTag_noPermission_returnsError() throws Exception {
        Mockito.when(authService.verifyToken(eq(JWT_TOKEN))).thenReturn(buildUser());
        Mockito.when(discordTokenService.getDiscordToken(eq(JWT_TOKEN))).thenReturn(DISCORD_TOKEN);

        String responseJson = objectMapper.writeValueAsString(Map.of(
            "success", false,
            "message", "You don't have permission to delete this tag"
        ));

        Mockito.when(restTemplate.exchange(
            contains("/guild/" + GUILD_ID + "/tag/delete"),
            eq(HttpMethod.DELETE),
            org.mockito.ArgumentMatchers.<HttpEntity<?>>any(),
            eq(String.class)
        )).thenReturn(new ResponseEntity<>(responseJson, HttpStatus.OK));

        mockMvc.perform(delete("/api/guild/" + GUILD_ID + "/tag/delete")
                .header("Authorization", "Bearer " + JWT_TOKEN)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("name", "other-tag"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.error", is("You don't have permission to delete this tag")));
    }

    // ==================== Token Verification Failure Tests ====================

    @Test
    @DisplayName("GET /api/guild/{id}/info - token verification failure returns 400")
    void getGuildInfo_tokenVerificationFails_returnsBadRequest() throws Exception {
        Mockito.when(authService.verifyToken(eq(JWT_TOKEN)))
            .thenThrow(new RuntimeException("Invalid token"));

        mockMvc.perform(get("/api/guild/" + GUILD_ID + "/info")
                .header("Authorization", "Bearer " + JWT_TOKEN))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error", containsString("Invalid token")));
    }

    @Test
    @DisplayName("POST /api/guild/{id}/tag/create - token verification failure returns 400")
    void createTag_tokenVerificationFails_returnsBadRequest() throws Exception {
        Mockito.when(authService.verifyToken(eq(JWT_TOKEN)))
            .thenThrow(new RuntimeException("Token expired"));

        mockMvc.perform(post("/api/guild/" + GUILD_ID + "/tag/create")
                .header("Authorization", "Bearer " + JWT_TOKEN)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("name", "test", "content", "content"))))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error", containsString("Token expired")));
    }

    // ==================== GET /{guildId}/command-usage Tests ====================

    @Test
    @DisplayName("GET /api/guild/{id}/command-usage - missing header returns 400")
    void getCommandUsage_missingHeader_returnsBadRequest() throws Exception {
        String fromIso = Instant.ofEpochSecond(1000000000L).toString();
        String toIso = Instant.ofEpochSecond(2000000000L).toString();
        mockMvc.perform(get("/api/guild/" + GUILD_ID + "/command-usage")
                .param("from", fromIso)
                .param("to", toIso)
                .param("interval", "1d"))
            .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("GET /api/guild/{id}/command-usage - invalid header returns 400")
    void getCommandUsage_invalidHeader_returnsBadRequest() throws Exception {
        String fromIso = Instant.ofEpochSecond(1000000000L).toString();
        String toIso = Instant.ofEpochSecond(2000000000L).toString();
        mockMvc.perform(get("/api/guild/" + GUILD_ID + "/command-usage")
                .header("Authorization", "InvalidToken")
                .param("from", fromIso)
                .param("to", toIso)
                .param("interval", "1d"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error", containsString("Invalid authorization header")));
    }

    @Test
    @DisplayName("GET /api/guild/{id}/command-usage - discord token not found returns 404")
    void getCommandUsage_discordTokenNotFound_returns404() throws Exception {
        Mockito.when(authService.verifyToken(eq(JWT_TOKEN))).thenReturn(buildUser());
        Mockito.when(discordTokenService.getDiscordToken(eq(JWT_TOKEN))).thenReturn(null);

        String fromIso = Instant.ofEpochSecond(1000000000L).toString();
        String toIso = Instant.ofEpochSecond(2000000000L).toString();
        mockMvc.perform(get("/api/guild/" + GUILD_ID + "/command-usage")
                .header("Authorization", "Bearer " + JWT_TOKEN)
                .param("from", fromIso)
                .param("to", toIso)
                .param("interval", "1d"))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.error", containsString("Discord token not found")));
    }

    @Test
    @DisplayName("GET /api/guild/{id}/command-usage - success returns command usage data")
    void getCommandUsage_success() throws Exception {
        Mockito.when(authService.verifyToken(eq(JWT_TOKEN))).thenReturn(buildUser());
        Mockito.when(discordTokenService.getDiscordToken(eq(JWT_TOKEN))).thenReturn(DISCORD_TOKEN);

        // External API returns timestamps as strings
        String commandUsageJson = objectMapper.writeValueAsString(List.of(
            Map.of(
                "name", "help",
                "group", "general",
                "command_id", 1,
                "values", List.of(
                    List.of("1000000000", 5),
                    List.of("1000001000", 3)
                )
            ),
            Map.of(
                "name", "ping",
                "group", "general",
                "command_id", 2,
                "values", List.of(
                    List.of("1000000000", 10),
                    List.of("1000001000", 8)
                )
            )
        ));

        Mockito.when(restTemplate.exchange(
            contains("/guild/" + GUILD_ID + "/command-usage"),
            eq(HttpMethod.GET),
            org.mockito.ArgumentMatchers.<HttpEntity<?>>any(),
            eq(String.class)
        )).thenReturn(new ResponseEntity<>(commandUsageJson, HttpStatus.OK));

        String fromIso = Instant.ofEpochSecond(1000000000L).toString();
        String toIso = Instant.ofEpochSecond(2000000000L).toString();
        mockMvc.perform(get("/api/guild/" + GUILD_ID + "/command-usage")
                .header("Authorization", "Bearer " + JWT_TOKEN)
                .param("from", fromIso)
                .param("to", toIso)
                .param("interval", "1d"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(2)))
            .andExpect(jsonPath("$[0].name", is("help")))
            .andExpect(jsonPath("$[0].group", is("general")))
            .andExpect(jsonPath("$[0].command_id", is(1)))
            .andExpect(jsonPath("$[0].values[0][0]", is(Instant.ofEpochSecond(1000000000L).toString()))) // Converted to ISO
            .andExpect(jsonPath("$[1].name", is("ping")))
            .andExpect(jsonPath("$[1].command_id", is(2)));
    }

    @Test
    @DisplayName("GET /api/guild/{id}/command-usage - external API error returns error")
    void getCommandUsage_externalApiError_returnsError() throws Exception {
        Mockito.when(authService.verifyToken(eq(JWT_TOKEN))).thenReturn(buildUser());
        Mockito.when(discordTokenService.getDiscordToken(eq(JWT_TOKEN))).thenReturn(DISCORD_TOKEN);

        String errorJson = objectMapper.writeValueAsString(Map.of("error", "Invalid time range"));

        Mockito.when(restTemplate.exchange(
            contains("/guild/" + GUILD_ID + "/command-usage"),
            eq(HttpMethod.GET),
            org.mockito.ArgumentMatchers.<HttpEntity<?>>any(),
            eq(String.class)
        )).thenReturn(new ResponseEntity<>(errorJson, HttpStatus.BAD_REQUEST));

        String fromIso = Instant.ofEpochSecond(2000000000L).toString();
        String toIso = Instant.ofEpochSecond(1000000000L).toString();
        mockMvc.perform(get("/api/guild/" + GUILD_ID + "/command-usage")
                .header("Authorization", "Bearer " + JWT_TOKEN)
                .param("from", fromIso)
                .param("to", toIso)
                .param("interval", "1d"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error", is("Invalid time range")));
    }

    @Test
    @DisplayName("GET /api/guild/{id}/command-usage - token verification failure returns 400")
    void getCommandUsage_tokenVerificationFails_returnsBadRequest() throws Exception {
        Mockito.when(authService.verifyToken(eq(JWT_TOKEN)))
            .thenThrow(new RuntimeException("Invalid token"));

        String fromIso = Instant.ofEpochSecond(1000000000L).toString();
        String toIso = Instant.ofEpochSecond(2000000000L).toString();
        mockMvc.perform(get("/api/guild/" + GUILD_ID + "/command-usage")
                .header("Authorization", "Bearer " + JWT_TOKEN)
                .param("from", fromIso)
                .param("to", toIso)
                .param("interval", "1d"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error", containsString("Invalid token")));
    }
}

