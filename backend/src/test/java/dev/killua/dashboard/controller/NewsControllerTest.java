package dev.killua.dashboard.controller;

import dev.killua.dashboard.dto.*;
import dev.killua.dashboard.service.AuthService;
import dev.killua.dashboard.service.DiscordTokenService;
import dev.killua.dashboard.service.NewsService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.HttpEntity;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.mockito.Mockito.lenient;

@ExtendWith(MockitoExtension.class)
class NewsControllerTest {

    @Mock
    private NewsService newsService;

    @Mock
    private AuthService authService;

    @Mock
    private DiscordTokenService discordTokenService;

    @Mock
    private RestTemplate restTemplate;

    @InjectMocks
    private NewsController newsController;

    private final String jwtToken = "test-jwt-token";
    private final String adminDiscordId = "admin123";
    private final String userDiscordId = "user123";
    private final String authHeader = "Bearer " + jwtToken;

    @BeforeEach
    void setUp() {
        // Create NewsController with mocked RestTemplate
        newsController = new NewsController(restTemplate);
        
        // Inject the mocked services using reflection
        try {
            java.lang.reflect.Field newsServiceField = NewsController.class.getDeclaredField("newsService");
            newsServiceField.setAccessible(true);
            newsServiceField.set(newsController, newsService);
            
            java.lang.reflect.Field authServiceField = NewsController.class.getDeclaredField("authService");
            authServiceField.setAccessible(true);
            authServiceField.set(newsController, authService);
            
            java.lang.reflect.Field discordTokenServiceField = NewsController.class.getDeclaredField("discordTokenService");
            discordTokenServiceField.setAccessible(true);
            discordTokenServiceField.set(newsController, discordTokenService);
        } catch (Exception e) {
            throw new RuntimeException("Failed to inject mocked services", e);
        }
    }

    @Test
    void getAllNews_Success() throws Exception {
        // Arrange
        NewsResponseDto news1 = createTestNewsResponse("1", "Test News 1");
        NewsResponseDto news2 = createTestNewsResponse("2", "Test News 2");
        List<NewsResponseDto> newsList = Arrays.asList(news1, news2);
        NewsResponseDataDto newsData = new NewsResponseDataDto(newsList);

        when(newsService.getAllNews(null)).thenReturn(newsData);

        // Act
        ResponseEntity<?> response = newsController.getAllNews(null);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        NewsResponseDataDto result = (NewsResponseDataDto) response.getBody();
        assertEquals(2, result.getNews().size());
        
        // Verify that the service was called
        verify(newsService).getAllNews(null);
    }

    @Test
    void getAllNews_ServiceException() throws Exception {
        // Arrange
        lenient().when(newsService.getAllNews(null)).thenThrow(new RuntimeException("Service error"));

        // Act
        ResponseEntity<?> response = newsController.getAllNews(null);

        // Assert
        assertEquals(HttpStatus.BAD_GATEWAY, response.getStatusCode());
        assertNotNull(response.getBody());
        @SuppressWarnings("unchecked")
        Map<String, String> errorBody = (Map<String, String>) response.getBody();
        assertTrue(errorBody.get("error").contains("Failed to fetch news"));
    }

    @Test
    void getNewsById_Success() throws Exception {
        // Arrange
        String newsId = "test-news-id";
        String discordToken = "test-discord-token";
        NewsResponseDto news = createTestNewsResponse(newsId, "Test News");
        UserDto userDto = new UserDto();
        userDto.setDiscordId("test-user");

        when(authService.verifyToken(jwtToken)).thenReturn(userDto);
        when(discordTokenService.getDiscordToken(jwtToken)).thenReturn(discordToken);
        when(newsService.getNewsById(newsId, discordToken)).thenReturn(news);

        // Act
        ResponseEntity<?> response = newsController.getNewsById(newsId, authHeader);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        NewsResponseDto result = (NewsResponseDto) response.getBody();
        assertEquals(newsId, result.getId());
        assertEquals("Test News", result.getTitle());
    }

    @Test
    void likeNews_Success() throws Exception {
        // Arrange
        LikeRequestDto likeRequest = new LikeRequestDto("test-news-id");
        Map<String, Object> serviceResponse = Map.of("liked", true, "likes_count", 5);

        when(newsService.likeNews(jwtToken, likeRequest.getNewsId())).thenReturn(serviceResponse);

        // Act
        ResponseEntity<?> response = newsController.likeNews(authHeader, likeRequest);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        @SuppressWarnings("unchecked")
        Map<String, Object> result = (Map<String, Object>) response.getBody();
        assertTrue((Boolean) result.get("liked"));
        assertEquals(5, result.get("likes_count"));
    }

    @Test
    void saveNews_AdminAccess_Success() throws Exception {
        // Arrange
        CreateNewsRequestDto createRequest = createTestCreateRequest();
        NewsSaveResponseDto saveResponse = new NewsSaveResponseDto("new-news-id", "message-id-123");
        UserDto userDto = new UserDto();
        userDto.setDiscordId(adminDiscordId);

        when(authService.verifyToken(jwtToken)).thenReturn(userDto);
        when(authService.isAdmin(adminDiscordId)).thenReturn(true);
        when(newsService.saveNews(jwtToken, createRequest)).thenReturn(saveResponse);

        // Act
        ResponseEntity<?> response = newsController.saveNews(authHeader, createRequest);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        NewsSaveResponseDto result = (NewsSaveResponseDto) response.getBody();
        assertEquals("new-news-id", result.getNewsId());
        assertEquals("message-id-123", result.getMessageId());
    }

    @Test
    void saveNews_NonAdminAccess_Forbidden() throws Exception {
        // Arrange
        CreateNewsRequestDto createRequest = createTestCreateRequest();
        UserDto userDto = new UserDto();
        userDto.setDiscordId(userDiscordId);

        when(authService.verifyToken(jwtToken)).thenReturn(userDto);
        when(authService.isAdmin(userDiscordId)).thenReturn(false);

        // Act
        ResponseEntity<?> response = newsController.saveNews(authHeader, createRequest);

        // Assert
        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        assertNotNull(response.getBody());
        @SuppressWarnings("unchecked")
        Map<String, String> errorBody = (Map<String, String>) response.getBody();
        assertEquals("Admin access required", errorBody.get("error"));
    }

    @Test
    void editNews_AdminAccess_Success() throws Exception {
        // Arrange
        String newsId = "test-news-id";
        EditNewsRequestDto editRequest = createTestEditRequest();
        Map<String, Object> serviceResponse = Map.of("success", true, "message", "News updated");
        UserDto userDto = new UserDto();
        userDto.setDiscordId(adminDiscordId);

        when(authService.verifyToken(jwtToken)).thenReturn(userDto);
        when(authService.isAdmin(adminDiscordId)).thenReturn(true);
        when(newsService.editNews(jwtToken, newsId, editRequest)).thenReturn(serviceResponse);

        // Act
        ResponseEntity<?> response = newsController.editNews(newsId, authHeader, editRequest);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        @SuppressWarnings("unchecked")
        Map<String, Object> result = (Map<String, Object>) response.getBody();
        assertTrue((Boolean) result.get("success"));
        assertEquals("News updated", result.get("message"));
    }

    @Test
    void editNews_NonAdminAccess_Forbidden() throws Exception {
        // Arrange
        String newsId = "test-news-id";
        EditNewsRequestDto editRequest = createTestEditRequest();
        UserDto userDto = new UserDto();
        userDto.setDiscordId(userDiscordId);

        when(authService.verifyToken(jwtToken)).thenReturn(userDto);
        when(authService.isAdmin(userDiscordId)).thenReturn(false);

        // Act
        ResponseEntity<?> response = newsController.editNews(newsId, authHeader, editRequest);

        // Assert
        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        assertNotNull(response.getBody());
        @SuppressWarnings("unchecked")
        Map<String, String> errorBody = (Map<String, String>) response.getBody();
        assertEquals("Admin access required", errorBody.get("error"));
    }

    @Test
    void deleteNews_AdminAccess_Success() throws Exception {
        // Arrange
        String newsId = "test-news-id";
        Map<String, Object> serviceResponse = Map.of("success", true, "message", "News deleted");
        UserDto userDto = new UserDto();
        userDto.setDiscordId(adminDiscordId);

        when(authService.verifyToken(jwtToken)).thenReturn(userDto);
        when(authService.isAdmin(adminDiscordId)).thenReturn(true);
        when(newsService.deleteNews(jwtToken, newsId)).thenReturn(serviceResponse);

        // Act
        ResponseEntity<?> response = newsController.deleteNews(newsId, authHeader);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        @SuppressWarnings("unchecked")
        Map<String, Object> result = (Map<String, Object>) response.getBody();
        assertTrue((Boolean) result.get("success"));
        assertEquals("News deleted", result.get("message"));
    }

    @Test
    void deleteNews_NonAdminAccess_Forbidden() throws Exception {
        // Arrange
        String newsId = "test-news-id";
        UserDto userDto = new UserDto();
        userDto.setDiscordId(userDiscordId);

        when(authService.verifyToken(jwtToken)).thenReturn(userDto);
        when(authService.isAdmin(userDiscordId)).thenReturn(false);

        // Act
        ResponseEntity<?> response = newsController.deleteNews(newsId, authHeader);

        // Assert
        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        assertNotNull(response.getBody());
        @SuppressWarnings("unchecked")
        Map<String, String> errorBody = (Map<String, String>) response.getBody();
        assertEquals("Admin access required", errorBody.get("error"));
    }

    private NewsResponseDto createTestNewsResponse(String id, String title) {
        NewsResponseDto news = new NewsResponseDto();
        news.setId(id);
        news.setTitle(title);
        news.setContent("Test content");
        news.setNewsType(NewsType.UPDATE);
        news.setLikes(2);
        news.setAuthor(new AuthorInfoDto("Test Author", "https://example.com/avatar.png"));
        news.setVersion("1.0.0");
        news.setMessageId("message-123");
        news.setPublished(true);
        news.setTimestamp(LocalDateTime.now());
        news.setLinks(Map.of("github", "https://github.com/test"));
        news.setNotifyUsers(new NotifyUsersDto(NotifyType.GROUP, new NotifyData("all")));
        return news;
    }

    private CreateNewsRequestDto createTestCreateRequest() {
        CreateNewsRequestDto request = new CreateNewsRequestDto();
        request.setTitle("Test News");
        request.setContent("Test content");
        request.setNewsType(NewsType.UPDATE);
        request.setVersion("1.0.0");
        request.setLinks(Map.of("github", "https://github.com/test"));
        request.setNotifyUsers(new NotifyUsersDto(NotifyType.GROUP, new NotifyData("all")));
        return request;
    }

    private EditNewsRequestDto createTestEditRequest() {
        EditNewsRequestDto request = new EditNewsRequestDto();
        request.setTitle("Updated News");
        request.setContent("Updated content");
        request.setNewsType(NewsType.NEWS);
        request.setVersion("1.1.0");
        request.setPublished(true);
        request.setLinks(Map.of("github", "https://github.com/test", "docs", "https://docs.test"));
        request.setNotifyUsers(new NotifyUsersDto(NotifyType.SPECIFIC, new NotifyData(Arrays.asList(123L, 456L))));
        return request;
    }
}
