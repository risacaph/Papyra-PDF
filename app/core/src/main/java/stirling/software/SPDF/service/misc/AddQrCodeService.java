package stirling.software.SPDF.service.misc;

import java.awt.image.BufferedImage;
import java.io.IOException;
import java.util.List;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.graphics.image.LosslessFactory;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.WriterException;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;

import lombok.RequiredArgsConstructor;

import stirling.software.SPDF.model.api.misc.AddQrCodeRequest;
import stirling.software.common.service.CustomPDFDocumentFactory;

/**
 * Generates a QR code from arbitrary text and stamps it onto selected pages of a PDF. Uses the
 * bundled ZXing core library for encoding (no external binaries) and PDFBox to draw the code in
 * append mode so existing page content is preserved.
 */
@Service
@RequiredArgsConstructor
public class AddQrCodeService {

    private static final int MIN_SIZE = 20;
    private static final int DEFAULT_SIZE = 100;
    private static final int MIN_POSITION = 1;
    private static final int MAX_POSITION = 9;
    private static final int DEFAULT_POSITION = 9;

    // Encode at a fixed, generous pixel resolution so the code stays crisp regardless of the
    // physical size it is drawn at on the page.
    private static final int QR_PIXELS = 400;
    private static final float MARGIN_FACTOR = 0.03f;
    private static final int BLACK = 0x000000;
    private static final int WHITE = 0xFFFFFF;

    private final CustomPDFDocumentFactory pdfDocumentFactory;

    /**
     * Load the supplied PDF, stamp the QR code onto the requested pages and return the modified
     * document. The caller owns the returned document and must close it.
     */
    public PDDocument addQrCode(AddQrCodeRequest request) throws IOException, WriterException {
        MultipartFile file = request.getFileInput();
        int size = clampSize(request.getSize());
        int position = clampPosition(request.getPosition());

        PDDocument document = pdfDocumentFactory.load(file);
        try {
            PDImageXObject qrImage =
                    LosslessFactory.createFromImage(document, renderQrCode(request.getContent()));

            List<Integer> pages = request.getPageNumbersList(document, true);
            for (int pageNumber : pages) {
                int pageIndex = pageNumber - 1;
                if (pageIndex < 0 || pageIndex >= document.getNumberOfPages()) {
                    continue;
                }
                PDPage page = document.getPage(pageIndex);
                PDRectangle box = page.getMediaBox();
                float margin = MARGIN_FACTOR * (box.getWidth() + box.getHeight()) / 2f;
                float x = positionX(box, position, size, margin);
                float y = positionY(box, position, size, margin);

                try (PDPageContentStream contentStream =
                        new PDPageContentStream(
                                document,
                                page,
                                PDPageContentStream.AppendMode.APPEND,
                                true,
                                true)) {
                    contentStream.drawImage(qrImage, x, y, size, size);
                }
            }
            return document;
        } catch (IOException | WriterException | RuntimeException e) {
            document.close();
            throw e;
        }
    }

    private BufferedImage renderQrCode(String content) throws WriterException {
        BitMatrix matrix =
                new QRCodeWriter().encode(content, BarcodeFormat.QR_CODE, QR_PIXELS, QR_PIXELS);
        BufferedImage image = new BufferedImage(QR_PIXELS, QR_PIXELS, BufferedImage.TYPE_INT_RGB);
        for (int y = 0; y < QR_PIXELS; y++) {
            for (int x = 0; x < QR_PIXELS; x++) {
                image.setRGB(x, y, matrix.get(x, y) ? BLACK : WHITE);
            }
        }
        return image;
    }

    private static float positionX(PDRectangle box, int position, int size, float margin) {
        return switch (position % 3) {
            case 1 -> box.getLowerLeftX() + margin;
            case 2 -> box.getLowerLeftX() + (box.getWidth() - size) / 2f;
            default -> box.getUpperRightX() - size - margin;
        };
    }

    private static float positionY(PDRectangle box, int position, int size, float margin) {
        return switch ((position - 1) / 3) {
            case 0 -> box.getUpperRightY() - margin - size;
            case 1 -> box.getLowerLeftY() + (box.getHeight() - size) / 2f;
            default -> box.getLowerLeftY() + margin;
        };
    }

    private static int clampSize(Integer size) {
        int requested = size != null ? size : DEFAULT_SIZE;
        return Math.max(MIN_SIZE, requested);
    }

    private static int clampPosition(Integer position) {
        int requested = position != null ? position : DEFAULT_POSITION;
        return Math.min(MAX_POSITION, Math.max(MIN_POSITION, requested));
    }
}
