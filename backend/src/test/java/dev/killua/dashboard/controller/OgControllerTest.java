package dev.killua.dashboard.controller;

import dev.killua.dashboard.dto.NewsResponseDto;
import dev.killua.dashboard.service.NewsService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OgControllerTest {

    @Mock
    private NewsService newsService;

    @InjectMocks
    private OgController ogController;

    @Test
    void render_CommandsPage() {
        ResponseEntity<String> response = ogController.render(request("/api/og/commands"));

        assertTrue(response.getBody().contains("og:title\" content=\"Commands | Killua\""));
        assertTrue(response.getBody().contains("og:description\" content=\"Explore over 100 advanced Discord commands"));
        assertTrue(response.getBody().contains("og:image\" content=\"https://killua.dev/illustrations/embed.webp\""));
    }

    @Test
    void render_ExploreCategory() {
        ResponseEntity<String> response = ogController.render(request("/api/og/explore/games"));

        assertTrue(response.getBody().contains("og:title\" content=\"Games with Friends Demo | Killua\""));
        assertTrue(response.getBody().contains("og:image\" content=\"https://killua.dev/illustrations/embed.webp\""));
    }

    @Test
    void render_NewsArticle() throws Exception {
        NewsResponseDto news = new NewsResponseDto();
        news.setTitle("Major update");
        news.setContent("Some **markdown** content for the preview.");
        news.setImages(java.util.List.of("https://api.killua.dev/image/news/update.png"));

        when(newsService.getNewsById(eq("123"), isNull())).thenReturn(news);

        ResponseEntity<String> response = ogController.render(request("/api/og/news/123"));

        assertTrue(response.getBody().contains("og:title\" content=\"Major update\""));
        assertTrue(response.getBody().contains("og:type\" content=\"article\""));
        assertTrue(response.getBody().contains("og:image\" content=\"https://api.killua.dev/image/news/update.png\""));
    }

    private MockHttpServletRequest request(String uri) {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI(uri);
        return request;
    }
}
