FROM python:3.8-slim
RUN useradd --create-home --shell /bin/bash app_user
WORKDIR /home/app_user
RUN pip install --upgrade --no-cache-dir openai
USER app_user
ENV OPENAI_API_KEY=""
CMD ["bash"]