package stirling.software.SPDF.controller.api.misc;

import java.io.IOException;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.multipart.MultipartFile;

import io.swagger.v3.oas.annotations.Operation;

import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;

import stirling.software.SPDF.model.api.misc.GrayscaleRequest;
import stirling.software.SPDF.service.misc.GrayscaleService;
import stirling.software.common.annotations.AutoJobPostMapping;
import stirling.software.common.annotations.api.MiscApi;
import stirling.software.common.enumeration.ResourceWeight;
import stirling.software.common.util.GeneralUtils;
import stirling.software.common.util.TempFileManager;
import stirling.software.common.util.WebResponseUtils;

@MiscApi
@RequiredArgsConstructor
public class GrayscaleController {

    private final GrayscaleService grayscaleService;
    private final TempFileManager tempFileManager;

    @AutoJobPostMapping(
            value = "/pdf-to-grayscale",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE,
            resourceWeight = ResourceWeight.LARGE_WEIGHT)
    @Operation(
            summary = "Convert a PDF to grayscale (ink-saver)",
            description =
                    "Rasterizes each page and rebuilds the document using grayscale images,"
                            + " reducing coloured ink usage when printing. Input:PDF Output:PDF"
                            + " Type:SISO")
    public ResponseEntity<Resource> pdfToGrayscale(@Valid @ModelAttribute GrayscaleRequest request)
            throws IOException {
        MultipartFile file = request.getFileInput();

        try (PDDocument grayscaleDocument =
                grayscaleService.convertToGrayscale(file, request.getDpi())) {
            String filename =
                    GeneralUtils.generateFilename(file.getOriginalFilename(), "_grayscale.pdf");
            return WebResponseUtils.pdfDocToWebResponse(
                    grayscaleDocument, filename, tempFileManager);
        }
    }
}
