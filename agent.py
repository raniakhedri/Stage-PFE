from openai import AzureOpenAI

client = AzureOpenAI(
    api_version="2024-12-01-preview",
    azure_endpoint="https://yassoura.openai.azure.com/",
    api_key="1ifpzvFVcs1rA9rntfDBchoU4NRraksgndiWCXjFsCLPJOZLhYYtJQQJ99CFACfhMk5XJ3w3AAABACOGvnbu"
)

response = client.chat.completions.create(
    model="gpt-5-codex",
    messages=[
        {"role": "user", "content": "Hello"}
    ]
)

print(response.choices[0].message.content)