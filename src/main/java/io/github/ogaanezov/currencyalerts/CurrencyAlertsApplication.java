package io.github.ogaanezov.currencyalerts;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;


@SpringBootApplication
@EnableScheduling
public class CurrencyAlertsApplication {

	public static void main(String[] args) {
		SpringApplication.run(CurrencyAlertsApplication.class, args);
	}

}
