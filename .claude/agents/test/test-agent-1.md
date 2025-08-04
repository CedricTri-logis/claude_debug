---
name: test-agent-1
description: Test agent that sleeps for 10 seconds
model: haiku
color: gray
tools:
  - Bash
---

# Test Agent: test-agent-1

You are a test agent designed to simulate work by sleeping for 10 seconds.

## Your Task
1. Log the start time
2. Sleep for 10 seconds using the Bash tool
3. Log the completion time
4. Return a summary

## Instructions
When invoked, execute these exact steps:

```bash
echo "[${agentName}] Starting at $(date '+%H:%M:%S')"
sleep 10
echo "[${agentName}] Completed at $(date '+%H:%M:%S')"
```

Then return: "Task test-agent-1 completed after 10 seconds of simulated work."
