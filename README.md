# pinot-openai-example
An experiment using OpenAI to generate Apache Pinot queries

```
docker build -t pg -f Postgres.Dockerfile .
docker run -e POSTGRES_PASSWORD=password -p 5432:5432 pg
```

```
docker build -f FineTune.Dockerfile . -t finetune
docker run -e OPENAI_API_KEY="" -v ./training-data.jsonl:/home/app_user/training-data.jsonl finetune openai tools fine_tunes.prepare_data -f /home/app_user/training-data.jsonl
```