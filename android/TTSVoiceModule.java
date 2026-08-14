package com.friday.voice;

import android.content.Context;
import android.speech.tts.TextToSpeech;
import android.speech.tts.Voice;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;

import java.util.Locale;
import java.util.Set;

public class TTSVoiceModule extends ReactContextBaseJavaModule {
    private TextToSpeech tts;

    public TTSVoiceModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "TTSVoiceModule";
    }

    @ReactMethod
    public void getOnDeviceVoices(Promise promise) {
        if (tts == null) {
            tts = new TextToSpeech(getReactApplicationContext(), status -> {
                if (status == TextToSpeech.SUCCESS) {
                    fetchVoices(promise);
                } else {
                    promise.reject("TTS_INIT_ERROR", "Failed to initialize Android TextToSpeech engine");
                }
            });
        } else {
            fetchVoices(promise);
        }
    }

    private void fetchVoices(Promise promise) {
        try {
            Set<Voice> voices = tts.getVoices();
            WritableArray voiceArray = Arguments.createArray();

            if (voices != null) {
                for (Voice v : voices) {
                    if (v.getLocale().getLanguage().equals(Locale.ENGLISH.getLanguage())) {
                        WritableMap map = Arguments.createMap();
                        map.putString("id", v.getName());
                        map.putString("name", "Android " + v.getName());
                        map.putString("provider", "device");
                        map.putString("gender", v.getName().contains("female") ? "female" : "male");
                        map.putString("language", v.getLocale().toLanguageTag());
                        map.putBoolean("isCloned", false);
                        map.putBoolean("isHD", v.getQuality() >= Voice.QUALITY_HIGH);
                        voiceArray.pushMap(map);
                    }
                }
            }
            promise.resolve(voiceArray);
        } catch (Exception e) {
            promise.reject("TTS_FETCH_ERROR", e.getMessage());
        }
    }
}
