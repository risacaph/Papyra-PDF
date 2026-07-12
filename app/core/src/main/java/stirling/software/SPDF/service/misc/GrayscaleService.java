package stirling.software.SPDF.service.misc;

import java.awt.image.BufferedImage;
import java.io.IOException;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.graphics.image.LosslessFactory;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.apache.pdfbox.rendering.ImageType;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import lombok.RequiredArgsConstructor;

import stirling.software.common.service.CustomPDFDocumentFactory;

/**
 * Converts a PDF to grayscale by rasterizing each page at a fixed resolution and rebuilding a new
 * document with one grayscale image per page. Pure PDFBox; no external binaries or extra
 * dependencies.
 */
@Service
@RequiredArgsConstructor
public class GrayscaleService {

    private static final int MIN_DPI = 72;
    private static final int MAX_DPI = 600;
    private static final int DEFAULT_DPI = 300;

    private final CustomPDFDocumentFactory pdfDocumentFactory;

    /**
     * Load the supplied PDF and return a new, independent grayscale document. The caller owns the
     * returned document and must close it.
     */
    public PDDocument convertToGrayscale(MultipartFile file, Integer dpi) throws IOException {
        int safeDpi = clampDpi(dpi);

        try (PDDocument document = pdfDocumentFactory.load(file)) {
            PDFRenderer renderer = new PDFRenderer(document);
            renderer.setSubsamplingAllowed(true);

            PDDocument grayscaleDocument = new PDDocument();
            try {
                int pageCount = document.getNumberOfPages();
                for (int pageIndex = 0; pageIndex < pageCount; pageIndex++) {
                    BufferedImage grayImage =
                            renderer.renderImageWithDPI(pageIndex, safeDpi, ImageType.GRAY);

                    PDRectangle sourceBox = document.getPage(pageIndex).getMediaBox();
                    PDPage grayscalePage =
                            new PDPage(
                                    new PDRectangle(sourceBox.getWidth(), sourceBox.getHeight()));
                    grayscaleDocument.addPage(grayscalePage);

                    try (PDPageContentStream contentStream =
                            new PDPageContentStream(
                                    grayscaleDocument,
                                    grayscalePage,
                                    PDPageContentStream.AppendMode.OVERWRITE,
                                    true,
                                    true)) {
                        PDImageXObject image =
                                LosslessFactory.createFromImage(grayscaleDocument, grayImage);
                        contentStream.drawImage(
                                image,
                                0,
                                0,
                                grayscalePage.getMediaBox().getWidth(),
                                grayscalePage.getMediaBox().getHeight());
                    }

                    grayImage.flush();
                }
                return grayscaleDocument;
            } catch (IOException | RuntimeException e) {
                grayscaleDocument.close();
                throw e;
            }
        }
    }

    private static int clampDpi(Integer dpi) {
        int requested = dpi != null ? dpi : DEFAULT_DPI;
        return Math.min(MAX_DPI, Math.max(MIN_DPI, requested));
    }
}
