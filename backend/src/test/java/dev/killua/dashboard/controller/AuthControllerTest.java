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
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private AuthService authService;

    @Mock
    private DiscordTokenService discordTokenService;

    @InjectMocks
    private AuthController authController;

    @BeforeEach
    void setup() {
        mockMvc = MockMvcBuilders.standaloneSetup(authController).build();
        ReflectionTestUtils.setField(authController, "objectMapper", objectMapper);
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

    @Test
    @DisplayName("POST /api/auth/login - missing code returns 400")
    void login_missingCode_returnsBadRequest() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of())))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error", containsString("Authorization code is required")));
    }

    @Test
    @DisplayName("POST /api/auth/login - success returns token and user")
    void login_success_returnsTokenAndUser() throws Exception {
        UserDto user = buildUser();
        Mockito.when(authService.processDiscordLogin(eq("abc")))
            .thenReturn(Map.of("jwt", "jwt-token-here"));
        Mockito.when(authService.getCurrentUser()).thenReturn(user);

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("code", "abc"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.token", is("jwt-token-here")))
            .andExpect(jsonPath("$.user.username", is("testuser")))
            .andExpect(jsonPath("$.user.discordId", is("1234567890")));
    }

    @Test
    @DisplayName("GET /api/auth/verify - missing/invalid header returns 400")
    void verify_invalidHeader_returnsBadRequest() throws Exception {
        mockMvc.perform(get("/api/auth/verify"))
            .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("GET /api/auth/verify - valid token returns user")
    void verify_validToken_returnsUser() throws Exception {
        UserDto user = buildUser();
        Mockito.when(authService.verifyToken(eq("jwt-token"))).thenReturn(user);

        mockMvc.perform(get("/api/auth/verify")
                .header("Authorization", "Bearer jwt-token"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.username", is("testuser")))
            .andExpect(jsonPath("$.discordId", is("1234567890")));
    }

    @Test
    @DisplayName("POST /api/auth/logout - always ok")
    void logout_alwaysOk() throws Exception {
        mockMvc.perform(post("/api/auth/logout")
                .header("Authorization", "Bearer anything"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.message", containsString("Logged out successfully")));
    }

    @Test
    @DisplayName("GET /api/auth/discord-token - invalid header returns 400")
    void discordToken_invalidHeader_returnsBadRequest() throws Exception {
        mockMvc.perform(get("/api/auth/discord-token"))
            .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("GET /api/auth/discord-token - not found returns 404")
    void discordToken_notFound_returns404() throws Exception {
        UserDto user = buildUser();
        Mockito.when(authService.verifyToken(eq("jwt-token"))).thenReturn(user);
        Mockito.when(discordTokenService.getDiscordToken(eq("jwt-token"))).thenReturn(null);

        mockMvc.perform(get("/api/auth/discord-token")
                .header("Authorization", "Bearer jwt-token"))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.error", containsString("Discord token not found")));
    }

    @Test
    @DisplayName("GET /api/auth/discord-token - success returns token and user")
    void discordToken_success() throws Exception {
        UserDto user = buildUser();
        Mockito.when(authService.verifyToken(eq("jwt-token"))).thenReturn(user);
        Mockito.when(discordTokenService.getDiscordToken(eq("jwt-token"))).thenReturn("discord-secret-token");

        mockMvc.perform(get("/api/auth/discord-token")
                .header("Authorization", "Bearer jwt-token"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.discordToken", is("discord-secret-token")))
            .andExpect(jsonPath("$.user.username", is("testuser")));
    }

    @Test
    @DisplayName("GET /api/auth/discord-token/debug - returns masked token info")
    void discordToken_debug() throws Exception {
        UserDto user = buildUser();
        Mockito.when(authService.verifyToken(eq("jwt-token"))).thenReturn(user);
        Mockito.when(discordTokenService.getDiscordToken(eq("jwt-token"))).thenReturn("discord-secret-token-1234567890");
        Mockito.when(discordTokenService.hasDiscordToken(eq("jwt-token"))).thenReturn(true);

        mockMvc.perform(get("/api/auth/discord-token/debug")
                .header("Authorization", "Bearer jwt-token"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.hasToken", is(true)))
            .andExpect(jsonPath("$.discordTokenLength", greaterThan(10)))
            .andExpect(jsonPath("$.user.username", is("testuser")));
    }

    @Test
    @DisplayName("GET /api/auth/userinfo - invalid header returns 400")
    void userinfo_invalidHeader() throws Exception {
        mockMvc.perform(get("/api/auth/userinfo"))
            .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("GET /api/auth/userinfo - success returns parsed user map")
    void userinfo_success() throws Exception {
        Mockito.when(authService.verifyToken(eq("jwt-token"))).thenReturn(buildUser());
        Mockito.when(discordTokenService.getDiscordToken(eq("jwt-token"))).thenReturn("discord-secret-token");

        String externalJson = objectMapper.writeValueAsString(Map.of(
            "id", "42",
            "username", "externalUser",
            "avatar", "extAvatar"
        ));
        Mockito.when(authService.fetchUserInfoFromExternalApi(eq("discord-secret-token")))
            .thenReturn(externalJson);

        mockMvc.perform(get("/api/auth/userinfo")
                .header("Authorization", "Bearer jwt-token"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id", is("42")))
            .andExpect(jsonPath("$.username", is("externalUser")))
            .andExpect(jsonPath("$.avatar", is("extAvatar")));
    }

    @Test
    @DisplayName("GET /api/auth/admin/check - returns admin flag and user")
    void adminCheck_returnsFlag() throws Exception {
        UserDto user = buildUser();
        Mockito.when(authService.verifyToken(eq("jwt-token"))).thenReturn(user);
        Mockito.when(authService.isAdmin(eq("1234567890"))).thenReturn(true);

        mockMvc.perform(get("/api/auth/admin/check")
                .header("Authorization", "Bearer jwt-token"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.isAdmin", is(true)))
            .andExpect(jsonPath("$.user.discordId", is("1234567890")));
    }

    @Test
    @DisplayName("GET /api/auth/admin/user/{id} - forbidden when not admin")
    void adminUserInfo_forbiddenWhenNotAdmin() throws Exception {
        UserDto user = buildUser();
        Mockito.when(authService.verifyToken(eq("jwt-token"))).thenReturn(user);
        Mockito.when(authService.isAdmin(eq("1234567890"))).thenReturn(false);

        mockMvc.perform(get("/api/auth/admin/user/555")
                .header("Authorization", "Bearer jwt-token"))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.error", containsString("Access denied")));
    }

    @Test
    @DisplayName("GET /api/auth/admin/user/{id} - success when admin")
    void adminUserInfo_success() throws Exception {
        UserDto user = buildUser();
        Mockito.when(authService.verifyToken(eq("jwt-token"))).thenReturn(user);
        Mockito.when(authService.isAdmin(eq("1234567890"))).thenReturn(true);

        Mockito.when(discordTokenService.getDiscordToken(eq("jwt-token"))).thenReturn("discord-secret-token");

        String externalJson = objectMapper.writeValueAsString(Map.of(
            "id", "555",
            "username", "adminTarget"
        ));
        Mockito.when(authService.fetchUserInfoFromExternalApiById(eq("discord-secret-token"), eq("555")))
            .thenReturn(externalJson);

        mockMvc.perform(get("/api/auth/admin/user/555")
                .header("Authorization", "Bearer jwt-token"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id", is("555")))
            .andExpect(jsonPath("$.username", is("adminTarget")));
    }
}


