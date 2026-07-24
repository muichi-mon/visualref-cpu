FROM python:3.11

WORKDIR /app

RUN apt-get update && apt-get install -y \
    git git-lfs ffmpeg libgl1 libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY . /app

RUN pip install --no-cache-dir --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

ENV PYTHONPATH=/app
ENV PORT=7860
ENV GRADIO_SERVER_NAME=0.0.0.0
ENV GRADIO_SERVER_PORT=7860

EXPOSE 7860

CMD ["python", "demo/app.py", "--config_path", "configs/demo/coco_clip_large.yaml", "--captioning_model_config_path", "configs/captioning/llava_8bit.yaml"]
