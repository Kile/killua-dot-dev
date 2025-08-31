package dev.killua.dashboard;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableJpaRepositories
@EnableScheduling
public class KilluaDashboardApplication {

    public static void main(String[] args) {
        SpringApplication.run(KilluaDashboardApplication.class, args);
    }
}
