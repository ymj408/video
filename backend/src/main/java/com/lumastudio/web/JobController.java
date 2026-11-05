package com.lumastudio.web;

import com.lumastudio.domain.AppUser;
import com.lumastudio.dto.CreateJobRequest;
import com.lumastudio.dto.JobResponse;
import com.lumastudio.service.JobDispatcher;
import com.lumastudio.service.JobService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/jobs")
@RequiredArgsConstructor
public class JobController {
    private final JobService jobService;
    private final JobDispatcher jobDispatcher;

    @PostMapping
    public ResponseEntity<JobResponse> create(
            @RequestAttribute(UserContextInterceptor.CURRENT_USER_ATTRIBUTE) AppUser user,
            @Valid @RequestBody CreateJobRequest request
    ) {
        JobResponse accepted = jobService.accept(user, request);
        jobDispatcher.dispatch(accepted.id());
        return ResponseEntity.accepted()
                .location(URI.create("/api/jobs/" + accepted.id()))
                .body(accepted);
    }

    @GetMapping
    public List<JobResponse> list(
            @RequestAttribute(UserContextInterceptor.CURRENT_USER_ATTRIBUTE) AppUser user,
            @RequestParam(required = false) String templateId,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "50") int limit
    ) {
        return jobService.listForUser(user, templateId, status, limit);
    }

    @GetMapping("/{id}")
    public JobResponse get(
            @RequestAttribute(UserContextInterceptor.CURRENT_USER_ATTRIBUTE) AppUser user,
            @PathVariable String id
    ) {
        return jobService.getForUser(user, id, true);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @RequestAttribute(UserContextInterceptor.CURRENT_USER_ATTRIBUTE) AppUser user,
            @PathVariable String id
    ) {
        jobService.deleteForUser(user, id);
    }
}
