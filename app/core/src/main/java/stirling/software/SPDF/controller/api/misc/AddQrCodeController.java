package stirling.software.SPDF.controller.api.misc;

import java.io.IOException;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.multipart.MultipartFile;

import com.google.zxing.WriterException;

import io.swagger.v3.oas.annotations.Operation;

import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;

import stirling.software.SPDF.model.api.misc.AddQrCodeRequest;
import stirling.software.SPDF.service.misc.AddQrCodeService;
import stirling.software.common.annotations.AutoJobPostMapping;
import stirling.software.common.annotations.api.MiscApi;
import stirling.software.common.enumeration.ResourceWeight;
import stirling.software.common.util.GeneralUtils;
import stirling.software.common.util.TempFileManager;
import stirling.software.common.util.WebResponseUtils;

@MiscApi
@RequiredArgsConstructor
public class AddQrCodeController {

    private final AddQrCodeService addQrCodeService;
    private final TempFileManager tempFileManager;

    @AutoJobPostMapping(
            value = "/add-qr-code",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE,
            resourceWeight = ResourceWeight.MEDIUM_WEIGHT)
    @Operation(
            summary = "Add a QR code to a PDF",
            description =
                    "Generates a QR code from the supplied text or URL and stamps it onto the"
                            + " selected pages at a chosen position. Input:PDF Output:PDF"
                            + " Type:SISO")
    public ResponseEntity<Resource> addQrCode(@Valid @ModelAttribute AddQrCodeRequest request)
            throws IOException, WriterException {
        MultipartFile file = request.getFileInput();

        try (PDDocument document = addQrCodeService.addQrCode(request)) {
            String filename = GeneralUtils.generateFilename(file.getOriginalFilename(), "_qr.pdf");
            return WebResponseUtils.pdfDocToWebResponse(document, filename, tempFileManager);
        }
    }
}
