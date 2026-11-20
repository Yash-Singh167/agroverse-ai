import sys
import os
import unittest
from unittest.mock import Mock, patch
from httpx import ASGITransport, AsyncClient

current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, "..", ".."))
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from backend.app.main import app
from backend.app.core.ai import generate_gemini_reply

class GeminiClientTests(unittest.TestCase):
    def test_request_uses_backend_key_and_extracts_reply(self):
        response = Mock()
        response.is_error = False
        response.json.return_value = {
            "candidates": [{
                "content": {
                    "parts": [{"text": "Use a soil test to guide the next step."}]
                }
            }]
        }

        with patch("backend.app.core.ai.httpx.Client") as client_factory:
            client = client_factory.return_value.__enter__.return_value
            client.post.return_value = response
            reply = generate_gemini_reply(
                api_key="test-api-key",
                model="gemini-test-model",
                message="What should I do?",
                farm_context={"crop_profile": {"crop": "tomato"}},
                conversation_history=[],
            )

        self.assertEqual(reply, "Use a soil test to guide the next step.")
        request = client.post.call_args
        self.assertEqual(request.args[0], "https://generativelanguage.googleapis.com/v1beta/models/gemini-test-model:generateContent")
        self.assertEqual(request.kwargs["headers"]["x-goog-api-key"], "test-api-key")
        self.assertIn('"crop": "tomato"', request.kwargs["json"]["contents"][-1]["parts"][0]["text"])

class AgroVerseAPITests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.provider_patcher = patch("backend.app.main.settings.AI_PROVIDER", "local")
        self.provider_patcher.start()
        self.addCleanup(self.provider_patcher.stop)
        self.transport = ASGITransport(app=app)
        self.client = AsyncClient(transport=self.transport, base_url="http://testserver")

    async def asyncTearDown(self):
        await self.client.aclose()

    async def test_01_root_endpoint(self):
        res = await self.client.get("/")
        self.assertEqual(res.status_code, 200)
        self.assertIn("AgroVerse AI", res.json()["project"])

    async def test_cors_allows_configured_frontend_origin_only(self):
        allowed = await self.client.options(
            "/api/sensors/latest",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "GET",
            },
        )
        denied = await self.client.options(
            "/api/sensors/latest",
            headers={
                "Origin": "https://untrusted.example",
                "Access-Control-Request-Method": "GET",
            },
        )

        self.assertEqual(allowed.headers.get("access-control-allow-origin"), "http://localhost:3000")
        self.assertIsNone(denied.headers.get("access-control-allow-origin"))

    async def test_02_telemetry_ingestion(self):
        payload = {
            "device_id": "AGRO_001",
            "soil_moisture": 26.5,
            "temperature": 31.2,
            "humidity": 45.0,
            "pump": False,
            "mode": "auto",
            "rssi": -65
        }
        res = await self.client.post("/api/telemetry", json=payload)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["status"], "success")

    async def test_03_get_latest_sensors(self):
        res = await self.client.get("/api/sensors/latest?device_id=AGRO_001")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("soil_moisture", data)
        self.assertIn("temperature", data)
        self.assertIn("humidity", data)
        self.assertIn("pump", data)

    async def test_04_sensor_history(self):
        res = await self.client.get("/api/sensors/history?device_id=AGRO_001&hours=10")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("data", data)
        self.assertGreater(data["count"], 0)

    async def test_05_device_status(self):
        res = await self.client.get("/api/device/status?device_id=AGRO_001")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["device_id"], "AGRO_001")
        self.assertTrue(data["is_online"])

    async def test_06_irrigation_control(self):
        req = {
            "device_id": "AGRO_001",
            "command": True,
            "duration_seconds": 180,
            "reason": "Test unit control"
        }
        res = await self.client.post("/api/irrigation/control", json=req)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["requested_state"], True)

    async def test_07_irrigation_mode(self):
        req = {
            "device_id": "AGRO_001",
            "mode": "manual",
            "moisture_threshold_low": 28.0,
            "moisture_threshold_high": 70.0
        }
        res = await self.client.post("/api/irrigation/mode", json=req)
        self.assertEqual(res.status_code, 200)

    async def test_08_ai_insights(self):
        res = await self.client.get("/api/ai/insights?device_id=AGRO_001")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("irrigation_required", data)
        self.assertIn("confidence", data)

    async def test_09_ai_chat(self):
        req = {
            "message": "Does my farm need water?",
            "device_id": "AGRO_001",
            "user_id": "test_farmer"
        }
        res = await self.client.post("/api/ai/chat", json=req)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("reply", data)
        self.assertIn("live_sensor_context", data)

    async def test_10_gemini_chat_uses_configured_model_and_farm_context(self):
        req = {
            "message": "How should I care for my crop?",
            "device_id": "AGRO_001",
            "farm_context": {
                "soil_moisture": 42.5,
                "temperature": 26.0,
                "humidity": 58.0,
                "pump": False,
                "crop": "tomato",
                "growth_stage": "flowering",
                "cultivation_method": "greenhouse drip"
            },
            "conversation_history": [
                {"role": "user", "content": "I am growing tomatoes."},
                {"role": "model", "content": "What growth stage are they in?"}
            ]
        }

        with patch("backend.app.main.settings.AI_PROVIDER", "gemini"), \
             patch("backend.app.main.settings.GEMINI_API_KEY", "test-api-key"), \
             patch("backend.app.main.settings.LLM_MODEL", "gemini-test-model"), \
             patch("backend.app.main.generate_gemini_reply", return_value="Gemini response") as generate:
            res = await self.client.post("/api/ai/chat", json=req)

        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["reply"], "Gemini response")
        self.assertEqual(res.json()["model"], "gemini-test-model")
        self.assertEqual(generate.call_args.kwargs["farm_context"]["crop_profile"]["crop"], "tomato")
        self.assertEqual(generate.call_args.kwargs["conversation_history"][0]["role"], "user")

    async def test_11_gemini_chat_requires_server_api_key(self):
        with patch("backend.app.main.settings.AI_PROVIDER", "gemini"), \
             patch("backend.app.main.settings.GEMINI_API_KEY", ""):
            res = await self.client.post("/api/ai/chat", json={"message": "Tell me about my crop"})

        self.assertEqual(res.status_code, 503)
        self.assertIn("GEMINI_API_KEY", res.json()["detail"])

if __name__ == "__main__":
    unittest.main()
