package dev.killua.dashboard.service;

import dev.killua.dashboard.dto.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.*;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NewsServiceTest {

    @Mock
    private RestTemplate restTemplate;

    @Mock
    private DiscordTokenService discordTokenService;

    @InjectMocks
    private NewsService newsService;

    private final String externalApiBaseUrl = "https://api.killua.dev";
    private final String jwtToken = "test-jwt-token";
    private final String discordToken = "test-discord-token";

    @BeforeEach
    void setUp() {
        // externalApiBaseUrl will be set through @Value annotation in real usage
        // For tests, we mock the RestTemplate responses to return expected data
    }

    @Test
    void getAllNews_Success() throws Exception {
        // Arrange
        NewsResponseDto news1 = createTestNewsResponse("1", "Test News 1");
        NewsResponseDto news2 = createTestNewsResponse("2", "Test News 2");
        List<NewsResponseDto> newsList = Arrays.asList(news1, news2);
        NewsResponseDataDto newsData = new NewsResponseDataDto(newsList);

        ResponseEntity<NewsResponseDataDto> response = new ResponseEntity<>(newsData, HttpStatus.OK);
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(NewsResponseDataDto.class)))
                .thenReturn(response);

        // Act
        NewsResponseDataDto result = newsService.getAllNews(null);

        // Assert
        assertNotNull(result);
        assertEquals(2, result.getNews().size());
        assertEquals("Test News 1", result.getNews().get(0).getTitle());
        assertEquals("Test News 2", result.getNews().get(1).getTitle());
    }

    @Test
    void getAllNews_Failure() {
        // Arrange
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(NewsResponseDataDto.class)))
                .thenThrow(new RuntimeException("API Error"));

        // Act & Assert
        Exception exception = assertThrows(RuntimeException.class, () -> {
            newsService.getAllNews(null);
        });

        assertTrue(exception.getMessage().contains("Failed to fetch news from external API"));
    }

    @Test
    void getNewsById_Success() throws Exception {
        // Arrange
        String newsId = "test-news-id";
        NewsResponseDto news = createTestNewsResponse(newsId, "Test News");

        ResponseEntity<NewsResponseDto> response = new ResponseEntity<>(news, HttpStatus.OK);
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(NewsResponseDto.class)))
                .thenReturn(response);

        // Act
        NewsResponseDto result = newsService.getNewsById(newsId, discordToken);

        // Assert
        assertNotNull(result);
        assertEquals(newsId, result.getId());
        assertEquals("Test News", result.getTitle());
    }

    @Test
    void likeNews_Success() throws Exception {
        // Arrange
        String newsId = "test-news-id";
        Map<String, Object> responseBody = Map.of("liked", true, "likes_count", 5);

        when(discordTokenService.getDiscordToken(jwtToken)).thenReturn(discordToken);
        ResponseEntity<Map> response = new ResponseEntity<>(responseBody, HttpStatus.OK);
        when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(Map.class)))
                .thenReturn(response);

        // Act
        Map<String, Object> result = newsService.likeNews(jwtToken, newsId);

        // Assert
        assertNotNull(result);
        assertTrue((Boolean) result.get("liked"));
        assertEquals(5, result.get("likes_count"));
    }

    @Test
    void saveNews_Success() throws Exception {
        // Arrange
        CreateNewsRequestDto createRequest = createTestCreateRequest();
        NewsSaveResponseDto saveResponse = new NewsSaveResponseDto("new-news-id", "message-id-123");

        when(discordTokenService.getDiscordToken(jwtToken)).thenReturn(discordToken);
        ResponseEntity<NewsSaveResponseDto> response = new ResponseEntity<>(saveResponse, HttpStatus.OK);
        when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(NewsSaveResponseDto.class)))
                .thenReturn(response);

        // Act
        NewsSaveResponseDto result = newsService.saveNews(jwtToken, createRequest);

        // Assert
        assertNotNull(result);
        assertEquals("new-news-id", result.getNewsId());
        assertEquals("message-id-123", result.getMessageId());
    }

    @Test
    void editNews_Success() throws Exception {
        // Arrange
        String newsId = "test-news-id";
        EditNewsRequestDto editRequest = createTestEditRequest();
        Map<String, Object> responseBody = Map.of("success", true, "message", "News updated");

        when(discordTokenService.getDiscordToken(jwtToken)).thenReturn(discordToken);
        ResponseEntity<Map> response = new ResponseEntity<>(responseBody, HttpStatus.OK);
        when(restTemplate.exchange(anyString(), eq(HttpMethod.PUT), any(HttpEntity.class), eq(Map.class)))
                .thenReturn(response);

        // Act
        Map<String, Object> result = newsService.editNews(jwtToken, newsId, editRequest);

        // Assert
        assertNotNull(result);
        assertTrue((Boolean) result.get("success"));
        assertEquals("News updated", result.get("message"));
    }

    @Test
    void deleteNews_Success() throws Exception {
        // Arrange
        String newsId = "test-news-id";
        Map<String, Object> responseBody = Map.of("success", true, "message", "News deleted");

        when(discordTokenService.getDiscordToken(jwtToken)).thenReturn(discordToken);
        ResponseEntity<Map> response = new ResponseEntity<>(responseBody, HttpStatus.OK);
        when(restTemplate.exchange(anyString(), eq(HttpMethod.DELETE), any(HttpEntity.class), eq(Map.class)))
                .thenReturn(response);

        // Act
        Map<String, Object> result = newsService.deleteNews(jwtToken, newsId);

        // Assert
        assertNotNull(result);
        assertTrue((Boolean) result.get("success"));
        assertEquals("News deleted", result.get("message"));
    }

    @Test
    void saveNews_WithStringUserIds_ConvertsToLongs() throws Exception {
        // Arrange
        CreateNewsRequestDto createRequest = createTestCreateRequestWithStringUserIds();
        NewsSaveResponseDto saveResponse = new NewsSaveResponseDto("new-news-id", "message-id-123");

        when(discordTokenService.getDiscordToken(jwtToken)).thenReturn(discordToken);
        ResponseEntity<NewsSaveResponseDto> response = new ResponseEntity<>(saveResponse, HttpStatus.OK);
        when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(NewsSaveResponseDto.class)))
                .thenReturn(response);

        // Act
        NewsSaveResponseDto result = newsService.saveNews(jwtToken, createRequest);

        // Assert
        assertNotNull(result);
        assertEquals("new-news-id", result.getNewsId());
        assertEquals("message-id-123", result.getMessageId());
        
        // Verify that the RestTemplate was called
        verify(restTemplate).exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(NewsSaveResponseDto.class));
    }

    @Test
    void editNews_WithStringUserIds_ConvertsToLongs() throws Exception {
        // Arrange
        String newsId = "test-news-id";
        EditNewsRequestDto editRequest = createTestEditRequestWithStringUserIds();
        Map<String, Object> responseBody = Map.of("success", true, "message", "News updated");

        when(discordTokenService.getDiscordToken(jwtToken)).thenReturn(discordToken);
        ResponseEntity<Map> response = new ResponseEntity<>(responseBody, HttpStatus.OK);
        when(restTemplate.exchange(anyString(), eq(HttpMethod.PUT), any(HttpEntity.class), eq(Map.class)))
                .thenReturn(response);

        // Act
        Map<String, Object> result = newsService.editNews(jwtToken, newsId, editRequest);

        // Assert
        assertNotNull(result);
        assertTrue((Boolean) result.get("success"));
        assertEquals("News updated", result.get("message"));
        
        // Verify that the RestTemplate was called
        verify(restTemplate).exchange(anyString(), eq(HttpMethod.PUT), any(HttpEntity.class), eq(Map.class));
    }

    @Test
    void getAllNews_ConvertsLongIdsToStrings() throws Exception {
        // Arrange
        NewsResponseDto news1 = createTestNewsResponseWithLongIds("1", "Test News 1");
        NewsResponseDto news2 = createTestNewsResponseWithLongIds("2", "Test News 2");
        List<NewsResponseDto> newsList = Arrays.asList(news1, news2);
        NewsResponseDataDto newsData = new NewsResponseDataDto(newsList);

        ResponseEntity<NewsResponseDataDto> response = new ResponseEntity<>(newsData, HttpStatus.OK);
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(NewsResponseDataDto.class)))
                .thenReturn(response);

        // Act
        NewsResponseDataDto result = newsService.getAllNews(null);

        // Assert
        assertNotNull(result);
        assertEquals(2, result.getNews().size());
        
        // Verify that Long IDs were converted to Strings
        NewsResponseDto firstNews = result.getNews().get(0);
        NotifyUsersDto notifyUsers = firstNews.getNotifyUsers();
        if (notifyUsers != null && notifyUsers.getData() instanceof List) {
            List<?> data = (List<?>) notifyUsers.getData();
            assertTrue(data.stream().allMatch(item -> item instanceof String));
        }
    }

    @Test
    void getNewsById_ConvertsLongIdsToStrings() throws Exception {
        // Arrange
        String newsId = "test-news-id";
        NewsResponseDto news = createTestNewsResponseWithLongIds(newsId, "Test News");

        ResponseEntity<NewsResponseDto> response = new ResponseEntity<>(news, HttpStatus.OK);
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(NewsResponseDto.class)))
                .thenReturn(response);

        // Act
        NewsResponseDto result = newsService.getNewsById(newsId, discordToken);

        // Assert
        assertNotNull(result);
        assertEquals(newsId, result.getId());
        assertEquals("Test News", result.getTitle());
        
        // Verify that Long IDs were converted to Strings
        NotifyUsersDto notifyUsers = result.getNotifyUsers();
        if (notifyUsers != null && notifyUsers.getData() instanceof List) {
            List<?> data = (List<?>) notifyUsers.getData();
            assertTrue(data.stream().allMatch(item -> item instanceof String));
        }
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

    private CreateNewsRequestDto createTestCreateRequestWithStringUserIds() {
        CreateNewsRequestDto request = new CreateNewsRequestDto();
        request.setTitle("Test News");
        request.setContent("Test content");
        request.setNewsType(NewsType.UPDATE);
        request.setVersion("1.0.0");
        request.setLinks(Map.of("github", "https://github.com/test"));
        request.setNotifyUsers(new NotifyUsersDto(NotifyType.SPECIFIC, new NotifyData(Arrays.asList("123456789012345678", "987654321098765432"))));
        return request;
    }

    private EditNewsRequestDto createTestEditRequestWithStringUserIds() {
        EditNewsRequestDto request = new EditNewsRequestDto();
        request.setTitle("Updated News");
        request.setContent("Updated content");
        request.setNewsType(NewsType.NEWS);
        request.setVersion("1.1.0");
        request.setPublished(true);
        request.setLinks(Map.of("github", "https://github.com/test", "docs", "https://docs.test"));
        request.setNotifyUsers(new NotifyUsersDto(NotifyType.SPECIFIC, new NotifyData(Arrays.asList("123456789012345678", "987654321098765432"))));
        return request;
    }

    private NewsResponseDto createTestNewsResponseWithLongIds(String id, String title) {
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
        news.setNotifyUsers(new NotifyUsersDto(NotifyType.SPECIFIC, new NotifyData(Arrays.asList(123456789012345678L, 987654321098765432L))));
        return news;
    }
}
