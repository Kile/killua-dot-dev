package dev.killua.dashboard.controller;

import dev.killua.dashboard.dto.NewsResponseDto;
import dev.killua.dashboard.service.NewsService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/og")
@CrossOrigin(origins = "*")
public class OgController {

    private static final Pattern NEWS_PATH = Pattern.compile("^/news/([a-zA-Z0-9_-]+)$");
    private static final Pattern EXPLORE_PATH = Pattern.compile("^/explore/([a-zA-Z0-9_-]+)$");

    @Autowired
    private NewsService newsService;

    private static final String SITE_NAME = "Killua";
    private static final String BASE_URL = "https://killua.dev";
    private static final String DEFAULT_IMAGE = BASE_URL + "/illustrations/embed.webp";
    private static final String DEFAULT_IMAGE_PATH = "/illustrations/embed.webp";
    private static final String DEFAULT_DESCRIPTION = "Killua: The Discord bot that does it better.";
    private static final String THEME_COLOR = "#5865F2";
    private static final int MAX_DESCRIPTION_LENGTH = 300;

    private record OgMeta(String title, String description, String imagePath, String type) {
        OgMeta(String title, String description, String imagePath) {
            this(title, description, imagePath, "website");
        }
    }

    private static final Map<String, OgMeta> STATIC_PAGES = buildStaticPages();
    private static final Map<String, OgMeta> EXPLORE_CATEGORIES = buildExploreCategories();

    @GetMapping(value = "/**", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> render(HttpServletRequest request) {
        String path = normalizePath(request.getRequestURI().substring("/api/og".length()));

        Matcher newsMatcher = NEWS_PATH.matcher(path);
        if (newsMatcher.matches()) {
            return renderNews(newsMatcher.group(1));
        }

        Matcher exploreMatcher = EXPLORE_PATH.matcher(path);
        if (exploreMatcher.matches()) {
            OgMeta meta = EXPLORE_CATEGORIES.get(exploreMatcher.group(1));
            if (meta != null) {
                return renderMeta(path, meta);
            }
        }

        OgMeta meta = STATIC_PAGES.get(path);
        if (meta != null) {
            return renderMeta(path, meta);
        }

        return renderMeta(path, defaultMeta());
    }

    private ResponseEntity<String> renderNews(String newsId) {
        String url = BASE_URL + "/news/" + newsId;
        try {
            NewsResponseDto news = newsService.getNewsById(newsId, null);

            String title = news.getTitle() != null ? news.getTitle() : "News";
            String description = buildDescription(news.getContent());
            String image = (news.getImages() != null && !news.getImages().isEmpty())
                    ? news.getImages().get(0)
                    : DEFAULT_IMAGE;

            return ResponseEntity.ok(buildHtml(title, description, image, url, "article"));
        } catch (Exception e) {
            return ResponseEntity.ok(buildHtml(
                    SITE_NAME, DEFAULT_DESCRIPTION, DEFAULT_IMAGE, url, "website"));
        }
    }

    private ResponseEntity<String> renderMeta(String path, OgMeta meta) {
        String url = BASE_URL + path;
        String image = meta.imagePath().startsWith("http")
                ? meta.imagePath()
                : BASE_URL + meta.imagePath();
        return ResponseEntity.ok(buildHtml(
                meta.title(), meta.description(), image, url, meta.type()));
    }

    private static OgMeta defaultMeta() {
        return new OgMeta(
                "Killua Discord Bot | Dashboard",
                "Killua — a modern, multipurpose Discord bot. Explore features, commands, and manage your account.",
                "/illustrations/embed.webp");
    }

    private static Map<String, OgMeta> buildStaticPages() {
        Map<String, OgMeta> pages = new LinkedHashMap<>();
        pages.put("/", defaultMeta());
        pages.put("/commands", new OgMeta(
                "Commands | " + SITE_NAME,
                "Explore over 100 advanced Discord commands for fun, moderation, games, and utility.",
                "/illustrations/embed.webp"));
        pages.put("/premium", new OgMeta(
                "Premium | " + SITE_NAME,
                "Unlock exclusive features, perks, and loot boxes by supporting Killua with a premium tier.",
                "/illustrations/embed.webp"));
        pages.put("/team", new OgMeta(
                "Our Team | " + SITE_NAME,
                "Meet the developers and artists behind Killua Discord Bot.",
                "/illustrations/embed.webp"));
        pages.put("/news", new OgMeta(
                "News & Updates | " + SITE_NAME,
                "Stay up to date with the latest features, releases, and changes to Killua.",
                "/illustrations/embed.webp"));
        pages.put("/disclaimer", new OgMeta(
                "Privacy & Disclaimer | " + SITE_NAME,
                "Learn how Killua Discord Bot handles your privacy and data security.",
                "/illustrations/embed.webp"));
        pages.put("/explore", new OgMeta(
                "Explore Killua | Interactive Demos",
                "What can Killua help you with? Try interactive Discord demos for games, memes, HxH cards, and more.",
                DEFAULT_IMAGE_PATH));
        return Map.copyOf(pages);
    }

    private static Map<String, OgMeta> buildExploreCategories() {
        Map<String, OgMeta> categories = new LinkedHashMap<>();
        categories.put("hxh", new OgMeta(
                "Hunter x Hunter Demo | " + SITE_NAME,
                "Collect cards, open boosters, and battle with Gon — experience Killua's HxH theme in a live Discord simulator.",
                DEFAULT_IMAGE_PATH));
        categories.put("activity", new OgMeta(
                "Boost Server Activity Demo | " + SITE_NAME,
                "Dead chat? Revive your server with /topic, trivia, voting rewards, and daily engagement tools.",
                DEFAULT_IMAGE_PATH));
        categories.put("organize", new OgMeta(
                "Organization & Tasks Demo | " + SITE_NAME,
                "Todo lists, server tags, and team workflows — manage your Discord server without leaving chat.",
                DEFAULT_IMAGE_PATH));
        categories.put("shitpost", new OgMeta(
                "Perfect Shitposting Demo | " + SITE_NAME,
                "Thonkify, spin, lego-ify, and more — unleash meme chaos with Killua's image manipulation commands.",
                DEFAULT_IMAGE_PATH));
        categories.put("expression", new OgMeta(
                "Express Yourself Demo | " + SITE_NAME,
                "Hug a friend, pat someone, or cheer them up — see Killua's action commands in a realistic Discord demo.",
                DEFAULT_IMAGE_PATH));
        categories.put("games", new OgMeta(
                "Games with Friends Demo | " + SITE_NAME,
                "Rock-paper-scissors, trivia, counting games, and more — play with friends anywhere on Discord.",
                DEFAULT_IMAGE_PATH));
        return Map.copyOf(categories);
    }

    private static String normalizePath(String path) {
        if (path == null || path.isEmpty() || "/".equals(path)) {
            return "/";
        }
        return path.endsWith("/") ? path.substring(0, path.length() - 1) : path;
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
