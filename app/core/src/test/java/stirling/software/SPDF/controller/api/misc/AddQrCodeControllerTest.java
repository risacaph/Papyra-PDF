package stirling.software.SPDF.controller.api.misc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import stirling.software.SPDF.model.api.misc.AddQrCodeRequest;
import stirling.software.SPDF.service.misc.AddQrCodeService;
import stirling.software.common.service.CustomPDFDocumentFactory;
import stirling.software.common.util.TempFile;
import stirling.software.common.util.TempFileManager;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("AddQrCodeController Tests")
class AddQrCodeControllerTest {

    @Mock private CustomPDFDocumentFactory pdfDocumentFactory;
    @Mock private TempFileManager tempFileManager;

    private AddQrCodeController controller;

    @BeforeEach
    void setUp() throws IOException {
        controller =
                new AddQrCodeController(new AddQrCodeService(pdfDocumentFactory), tempFileManager);

        // Real temp file backing so WebResponseUtils.pdfDocToWebResponse can save the output.
        lenient()
                .when(tempFileManager.createManagedTempFile(anyString()))
                .thenAnswer(
                        inv -> {
                            File f =
                                    Files.createTempFile("qr_test", inv.<String>getArgument(0))
                                            .toFile();
                            f.deleteOnExit();
                            TempFile tf = mock(TempFile.class);
                            lenient().when(tf.getFile()).thenReturn(f);
                            lenient().when(tf.getPath()).thenReturn(f.toPath());
                            return tf;
                        });
    }

    // ---------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------

    private static MockMultipartFile pdfFile(String filename, int pageCount) throws IOException {
        try (PDDocument doc = new PDDocument()) {
            for (int i = 0; i < pageCount; i++) {
                doc.addPage(new PDPage(PDRectangle.A4));
            }
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            doc.save(baos);
            return new MockMultipartFile(
                    "fileInput", filename, "application/pdf", baos.toByteArray());
        }
    }

    /** Stub the factory to return fresh real documents loaded from the multipart bytes. */
    private void stubFactoryLoad() throws IOException {
        lenient()
                .when(pdfDocumentFactory.load(any(MultipartFile.class)))
                .thenAnswer(inv -> Loader.loadPDF(((MultipartFile) inv.getArgument(0)).getBytes()));
    }

    private static AddQrCodeRequest request(MockMultipartFile file, String content) {
        AddQrCodeRequest req = new AddQrCodeRequest();
        req.setFileInput(file);
        req.setContent(content);
        req.setPageNumbers("all");
        req.setPosition(9);
        req.setSize(80);
        return req;
    }

    private static byte[] drain(ResponseEntity<Resource> response) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (InputStream in = response.getBody().getInputStream()) {
            in.transferTo(baos);
        }
        return baos.toByteArray();
    }

    // ---------------------------------------------------------------------
    // End-to-end controller behaviour (real encoding + rendering, mocked boundaries)
    // ---------------------------------------------------------------------

    @Test
    @DisplayName("stamps a QR code and returns a valid PDF preserving page count")
    void happyPath() throws Exception {
        MockMultipartFile file = pdfFile("input.pdf", 2);
        stubFactoryLoad();

        ResponseEntity<Resource> response =
                controller.addQrCode(request(file, "https://example.com"));

        assertThat(response).isNotNull();
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();

        byte[] out = drain(response);
        assertThat(out).isNotEmpty();
        try (PDDocument result = Loader.loadPDF(out)) {
            assertThat(result.getNumberOfPages()).isEqualTo(2);
        }
    }

    @Test
    @DisplayName("applies defaults when size and position are null")
    void defaultsApplied() throws Exception {
        MockMultipartFile file = pdfFile("defaults.pdf", 1);
        stubFactoryLoad();

        AddQrCodeRequest req = new AddQrCodeRequest();
        req.setFileInput(file);
        req.setContent("plain text");
        req.setPageNumbers("all");
        req.setPosition(null);
        req.setSize(null);

        ResponseEntity<Resource> response = controller.addQrCode(req);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(drain(response)).isNotEmpty();
    }

    @Test
    @DisplayName("clamps out-of-range size and position without failing")
    void clampsExtremes() throws Exception {
        MockMultipartFile file = pdfFile("clamp.pdf", 1);
        stubFactoryLoad();

        AddQrCodeRequest req = request(file, "clamp me");
        req.setPosition(99);
        req.setSize(1);

        ResponseEntity<Resource> response = controller.addQrCode(req);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(drain(response)).isNotEmpty();
    }
}
