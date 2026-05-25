package dev.killua.dashboard.controller;

import dev.killua.dashboard.dto.NewsResponseDto;
import dev.killua.dashboard.service.NewsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/og")
@CrossOrigin(origins = "*")
public class OgController {

    @Autowired
    private NewsService newsService;

    private static final String SITE_NAME = "Killua";
    private static final String BASE_URL = "https://killua.dev";
    private static final String DEFAULT_IMAGE = BASE_URL + "/illustrations/embed.webp";
    private static final String DEFAULT_DESCRIPTION = "Killua: The Discord bot that does it better.";
    private static final String THEME_COLOR = "#5865F2";
    private static final int MAX_DESCRIPTION_LENGTH = 200;

    @GetMapping(value = "/news/{newsId}", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> getNewsOg(@PathVariable String newsId) {
        try {
            NewsResponseDto news = newsService.getNewsById(newsId, null);

            String title = news.getTitle() != null ? news.getTitle() : "News";
            String fullTitle = title + " | " + SITE_NAME;
            String description = buildDescription(news.getContent());
            String image = (news.getImages() != null && !news.getImages().isEmpty())
                    ? news.getImages().get(0)
                    : DEFAULT_IMAGE;
            String url = BASE_URL + "/news/" + newsId;

            return ResponseEntity.ok(buildHtml(fullTitle, description, image, url, "article"));
        } catch (Exception e) {
            String url = BASE_URL + "/news/" + newsId;
            return ResponseEntity.ok(buildHtml(
                    SITE_NAME, DEFAULT_DESCRIPTION, DEFAULT_IMAGE, url, "website"));
        }
    }

    private String buildDescription(String content) {
        if (content == null || content.isBlank()) {
            return DEFAULT_DESCRIPTION;
        }
        String stripped = content
                .replaceAll("#+\\s*", "")
                .replaceAll("\\*+", "")
                .replaceAll("_+", "")
                .replaceAll("~+", "")
                .replaceAll("`+", "")
                .replaceAll("\\[([^]]*)]\\([^)]*\\)", "$1")
                .replaceAll("!\\[([^]]*)]\\([^)]*\\)", "$1")
                .replaceAll("<[^>]+>", "")
                .replaceAll("\\s+", " ")
                .trim();

        if (stripped.length() > MAX_DESCRIPTION_LENGTH) {
            stripped = stripped.substring(0, MAX_DESCRIPTION_LENGTH).trim() + "...";
        }
        return stripped.isEmpty() ? DEFAULT_DESCRIPTION : stripped;
    }

    private String buildHtml(String title, String description, String image, String url, String type) {
        String safeTitle = escapeHtml(title);
        String safeDescription = escapeHtml(description);
        String safeImage = escapeHtml(image);
        String safeUrl = escapeHtml(url);

        return "<!DOCTYPE html>\n"
                + "<html lang=\"en\">\n<head>\n"
                + "<meta charset=\"UTF-8\"/>\n"
                + "<meta property=\"og:type\" content=\"" + type + "\"/>\n"
                + "<meta property=\"og:url\" content=\"" + safeUrl + "\"/>\n"
                + "<meta property=\"og:title\" content=\"" + safeTitle + "\"/>\n"
                + "<meta property=\"og:description\" content=\"" + safeDescription + "\"/>\n"
                + "<meta property=\"og:image\" content=\"" + safeImage + "\"/>\n"
                + "<meta property=\"og:site_name\" content=\"" + SITE_NAME + "\"/>\n"
                + "<meta property=\"og:locale\" content=\"en_US\"/>\n"
                + "<meta name=\"theme-color\" content=\"" + THEME_COLOR + "\"/>\n"
                + "<meta name=\"twitter:card\" content=\"summary_large_image\"/>\n"
                + "<meta name=\"twitter:title\" content=\"" + safeTitle + "\"/>\n"
                + "<meta name=\"twitter:description\" content=\"" + safeDescription + "\"/>\n"
                + "<meta name=\"twitter:image\" content=\"" + safeImage + "\"/>\n"
                + "<meta http-equiv=\"refresh\" content=\"0;url=" + safeUrl + "\"/>\n"
                + "<title>" + safeTitle + "</title>\n"
                + "</head>\n<body></body>\n</html>";
    }

    private static String escapeHtml(String input) {
        if (input == null) return "";
        return input
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}
