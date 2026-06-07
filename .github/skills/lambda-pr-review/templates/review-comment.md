# Review Comment Template

## Inline Comment (per finding)

````markdown
**[{SEVERITY}]** {short_title}

{description_in_english}

**Suggestion:**

```typescript
{
  code_suggestion;
}
```

📎 Rule: {rule_name}

<!-- copilot-review: {filePath}:{startLine}:{category} -->
````

> `{category}` MUST be one of the Finding Categories in `review-criteria.md`. The HTML comment is required for idempotent push (skip if marker already exists on the PR).

## Summary Thread (first comment on PR)

```markdown
## 🔍 Code Review Summary — PR {pr_id}

**Reviewer**: AI Code Review Agent
**Date**: {date}
**Recommended vote**: {recommended_vote}

### Statistics

- 🔴 Critical: {n}
- 🟠 High: {n}
- 🟡 Medium: {n}
- 🟢 Low: {n}

### Assessment

{short_summary_in_english}

### Modules

{module_list}

---

_Automated review by Lambda API AI Code Review Agent_
```

## Thread Status Mapping

| Severity | Thread Status |
| -------- | ------------- |
| CRITICAL | `active`      |
| HIGH     | `active`      |
| MEDIUM   | `active`      |
| LOW      | `active`      |

> All comments default to `active`. Let the PR author resolve them.
