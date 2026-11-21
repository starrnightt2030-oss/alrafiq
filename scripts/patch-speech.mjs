// تعديل صغير على إضافة الكلام في أندرويد (بيتعمل أوتوماتيك بعد npm install):
// بنطلب من جوجل يستنى سكوت أطول قبل ما يقفل المايك، عشان الطفل لو اتأخر ثانية أو وقف في نص الآية مايضيعش كلامه
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
const f = 'node_modules/@capacitor-community/speech-recognition/android/src/main/java/com/getcapacitor/community/speechrecognition/SpeechRecognition.java';
if (!existsSync(f)) process.exit(0);
let s = readFileSync(f, 'utf8');
if (s.includes('SIRAJ_READY')) process.exit(0);
const anchor = 'intent.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, partialResults);';
if (!s.includes(anchor)) { console.warn('patch-speech: anchor not found'); process.exit(0); }
if (!s.includes('SIRAJ_SILENCE')) s = s.replace(anchor, `${anchor}
        // SIRAJ_SILENCE: سكوت أطول قبل ما المايك يقفل
        intent.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS, 2500L);
        intent.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS, 2000L);
        intent.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_MINIMUM_LENGTH_MILLIS, 3000L);`);
// SIRAJ_READY: إشارة «المايك جاهز يسمع» الحقيقية من أندرويد (كانت فاضية)، عشان «ابدأ التلاوة» تظهر في وقتها بالظبط
const ready = 'public void onReadyForSpeech(Bundle params) {}';
if (s.includes(ready)) s = s.replace(ready, `public void onReadyForSpeech(Bundle params) {
            // SIRAJ_READY
            try { JSObject r = new JSObject(); r.put("status", "ready"); SpeechRecognition.this.notifyListeners(LISTENING_EVENT, r); } catch (Exception e) {}
        }`);
else console.warn('patch-speech: ready anchor not found');
writeFileSync(f, s);
console.log('patch-speech: done');
