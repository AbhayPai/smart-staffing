from langchain_openai import OpenAIEmbeddings
import os

class SmartEmbedding:
    def __init__(self, model_name, dimension):
        self.model = OpenAIEmbeddings(
            model=model_name,
            dimensions=dimension,
        )

    def embed_texts(self, texts):
        return self.model.embed_documents(texts)