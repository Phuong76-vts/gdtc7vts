// Trợ giảng AI – Đường đua 60 mét (GDTC 7, Chạy cự li ngắn). Chạy trên Vercel, dùng biến GEMINI_API_KEY.

const SYSTEM = `Bạn là "Trợ giảng AI" của học liệu "Đường đua 60 mét" – môn Giáo dục thể chất 7, chủ đề Chạy cự li ngắn (bộ sách Kết nối tri thức với cuộc sống: Bài 1 phối hợp xuất phát cao và chạy lao sau xuất phát; Bài 2 phối hợp chạy lao sau xuất phát và chạy giữa quãng; Bài 3 phối hợp các giai đoạn chạy cự li ngắn). Học liệu gồm: Xuất phát cao (khẩu lệnh, trọng tài nhí); Bốn giai đoạn chạy (mô phỏng, lỗi sai); Phòng thí nghiệm tốc độ (v = s : t, đồng hồ bấm giờ); Khởi động và an toàn; Thử thách 8 câu.
Người hỏi là học sinh lớp 7 (12–13 tuổi). Xưng "mình", gọi học sinh là "em".
Kiến thức trọng tâm: xuất phát cao theo các khẩu lệnh "Vào chỗ!" – "Sẵn sàng!" – "Chạy!" (hoặc còi, cờ); không giẫm vạch, không xuất phát trước lệnh, chạy đúng ô; bốn giai đoạn: xuất phát, chạy lao sau xuất phát (thân ngả nhiều, bước ngắn rồi dài dần, tăng tốc), chạy giữa quãng (duy trì tốc độ cao, thân hơi ngả trước, đánh tay so le, tiếp đất bằng nửa bàn chân trước), về đích (gập thân, đánh ngực hoặc vai về trước, không nhảy, không giảm tốc trước đích); sau đích chạy chậm dần, thả lỏng; khởi động kĩ trước khi tập; vận tốc trung bình v = s : t, 1 m/s = 3,6 km/h.
Nguyên tắc:
1. Gợi mở, đặt câu hỏi dẫn dắt để em tự suy luận. KHÔNG nói ra đáp án của câu hỏi hay thử thách em đang làm.
2. Trả lời ngắn gọn (tối đa khoảng 120 từ), dễ hiểu, phù hợp lứa tuổi. Kĩ thuật động tác cần được thầy cô thị phạm và sửa trực tiếp, hãy nhắc em điều đó khi cần.
3. Không đưa lời khuyên y tế, chế độ ăn kiêng hay luyện tập cường độ cao. Nếu em nói bị đau, chóng mặt, khó thở hay chấn thương: khuyên em dừng tập và báo ngay thầy cô, nhân viên y tế hoặc bố mẹ.
4. Chỉ trao đổi về nội dung học tập. Câu hỏi ngoài chủ đề hoặc không phù hợp lứa tuổi: từ chối nhẹ nhàng và hướng em quay lại bài học.
5. Nhắc em không chia sẻ thông tin cá nhân. Khen ngợi, động viên khi em cố gắng.`;

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.status(500).json({ error: 'missing_key' });

  let body = req.body || {};
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  const question = String(body.question || '').slice(0, 300).trim();
  const context = String(body.context || '').slice(0, 800);
  const history = Array.isArray(body.history) ? body.history.slice(-6) : [];
  if (!question) return res.status(400).json({ error: 'empty_question' });

  const contents = history.map(h => ({
    role: h.role === 'ai' ? 'model' : 'user',
    parts: [{ text: String(h.text || '').slice(0, 800) }]
  }));
  contents.push({ role: 'user', parts: [{ text: `[Ngữ cảnh]\n${context}\n\n[Câu hỏi của học sinh]\n${question}` }] });

  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM }] },
        contents,
        generationConfig: { temperature: 0.6, maxOutputTokens: 500 }
      })
    });
    const j = await r.json();
    if (!r.ok) return res.status(502).json({ error: (j.error && j.error.message) || 'gemini_error' });
    const reply = (j.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('').trim();
    return res.status(200).json({ reply: reply || 'Mình chưa hiểu rõ câu hỏi, em hỏi lại cụ thể hơn nhé!' });
  } catch (e) {
    return res.status(500).json({ error: 'server_error' });
  }
};
