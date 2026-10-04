package com.meetclone.identity.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.List;

@Configuration
public class OAuth2Config {

    @Bean
    public RestClient restClient(ObjectMapper objectMapper) {
        MappingJackson2HttpMessageConverter jacksonConverter = new MappingJackson2HttpMessageConverter(objectMapper);
        List<MediaType> supportedMediaTypes = new ArrayList<>(jacksonConverter.getSupportedMediaTypes());
        supportedMediaTypes.add(MediaType.valueOf("text/javascript"));
        supportedMediaTypes.add(MediaType.valueOf("text/javascript;charset=UTF-8"));
        jacksonConverter.setSupportedMediaTypes(supportedMediaTypes);

        return RestClient.builder()
                .messageConverters(converters -> converters.add(0, jacksonConverter))
                .build();
    }
}

