"""Business-logic services (turn pipeline, summaries, memory, sentiment).

Services orchestrate the providers and the data layer. They contain no vendor SDK calls
directly — only calls through ``app.providers`` interfaces — so they are unit-testable with
mock providers.
"""
