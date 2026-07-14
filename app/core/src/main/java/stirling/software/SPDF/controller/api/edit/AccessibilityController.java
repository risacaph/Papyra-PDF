package stirling.software.SPDF.controller.api.edit;

import java.io.IOException;

import org.apache.pdfbox.cos.COSDictionary;
import org.apache.pdfbox.cos.COSName;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDDocumentCatalog;
import org.apache.pdfbox.pdmodel.PDDocumentInformation;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.documentinterchange.logicalstructure.PDMarkInfo;
import org.apache.pdfbox.pdmodel.interactive.viewerpreferences.PDViewerPreferences;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.fasterxml.jackson.annotation.JsonInclude;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.tags.Tag;

import lombok.RequiredArgsConstructor;

import stirling.software.common.service.CustomPDFDocumentFactory;
import stirling.software.common.util.ExceptionUtils;
import stirling.software.common.util.GeneralUtils;
import stirling.software.common.util.TempFileManager;
import stirling.software.common.util.WebResponseUtils;

@RestController
@RequestMapping("/api/v1/edit/accessibility")
@Tag(name = "Edit", description = "Inspect and edit document structure such as link annotations.")
@RequiredArgsConstructor
public class AccessibilityController {

    private final CustomPDFDocumentFactory pdfDocumentFactory;
    private final TempFileManager tempFileManager;

    /** Document-level accessibility properties reported by the audit endpoint. */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record AccessibilityAudit(
            String title,
            String language,
            boolean tagged,
            boolean marked,
            boolean displayDocTitle,
            boolean encrypted,
            boolean accessibilityExtractionAllowed,
            int pageCount) {}

    @PostMapping(value = "/audit", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(
            summary = "Audit document-level accessibility properties",
            description =
                    "Reports the accessibility-relevant document properties: title, language,"
                            + " tagged/marked state, the display-document-title viewer preference"
                            + " and whether content extraction for accessibility is allowed."
                            + " Input:PDF Output:JSON Type:SISO")
    public ResponseEntity<AccessibilityAudit> auditAccessibility(
            @Parameter(
                            description = "The input PDF file",
                            required = true,
                            content =
                                    @Content(
                                            mediaType = MediaType.APPLICATION_PDF_VALUE,
                                            schema = @Schema(type = "string", format = "binary")))
                    @RequestParam("fileInput")
                    MultipartFile fileInput)
            throws IOException {
        requirePdf(fileInput);
        try (PDDocument document = pdfDocumentFactory.load(fileInput, true)) {
            PDDocumentCatalog catalog = document.getDocumentCatalog();
            PDDocumentInformation info = document.getDocumentInformation();
            PDMarkInfo markInfo = catalog.getMarkInfo();
            PDViewerPreferences viewerPreferences = catalog.getViewerPreferences();
            return ResponseEntity.ok(
                    new AccessibilityAudit(
                            info != null ? info.getTitle() : null,
                            catalog.getLanguage(),
                            catalog.getStructureTreeRoot() != null,
                            markInfo != null && markInfo.isMarked(),
                            viewerPreferences != null && viewerPreferences.displayDocTitle(),
                            document.isEncrypted(),
                            document.getCurrentAccessPermission().canExtractForAccessibility(),
                            document.getNumberOfPages()));
        }
    }

    @PostMapping(value = "/apply", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(
            summary = "Apply document-level accessibility fixes",
            description =
                    "Sets the fixable document-level accessibility properties: document title,"
                            + " document language, the display-document-title viewer preference"
                            + " and the structure tab order on every page. Input:PDF Output:PDF"
                            + " Type:SISO")
    public ResponseEntity<Resource> applyAccessibilityFixes(
            @Parameter(
                            description = "The input PDF file",
                            required = true,
                            content =
                                    @Content(
                                            mediaType = MediaType.APPLICATION_PDF_VALUE,
                                            schema = @Schema(type = "string", format = "binary")))
                    @RequestParam("fileInput")
                    MultipartFile fileInput,
            @Parameter(description = "Document title to set (skipped when blank)")
                    @RequestParam(value = "title", required = false)
                    String title,
            @Parameter(description = "Document language to set, e.g. en-US (skipped when blank)")
                    @RequestParam(value = "language", required = false)
                    String language,
            @Parameter(description = "Set the viewer preference to display the document title")
                    @RequestParam(value = "setDisplayDocTitle", defaultValue = "false")
                    boolean setDisplayDocTitle,
            @Parameter(description = "Set the tab order of every page to follow the structure")
                    @RequestParam(value = "setStructureTabOrder", defaultValue = "false")
                    boolean setStructureTabOrder)
            throws IOException {
        requirePdf(fileInput);
        boolean hasTitle = title != null && !title.isBlank();
        boolean hasLanguage = language != null && !language.isBlank();
        if (!hasTitle && !hasLanguage && !setDisplayDocTitle && !setStructureTabOrder) {
            throw ExceptionUtils.createIllegalArgumentException(
                    "error.dataRequired", "{0} must contain at least one fix", "request");
        }
        try (PDDocument document = pdfDocumentFactory.load(fileInput)) {
            PDDocumentCatalog catalog = document.getDocumentCatalog();
            if (hasTitle) {
                PDDocumentInformation info = document.getDocumentInformation();
                if (info == null) {
                    info = new PDDocumentInformation();
                    document.setDocumentInformation(info);
                }
                info.setTitle(title.trim());
            }
            if (hasLanguage) {
                catalog.setLanguage(language.trim());
            }
            if (setDisplayDocTitle) {
                PDViewerPreferences viewerPreferences = catalog.getViewerPreferences();
                if (viewerPreferences == null) {
                    viewerPreferences = new PDViewerPreferences(new COSDictionary());
                }
                viewerPreferences.setDisplayDocTitle(true);
                catalog.setViewerPreferences(viewerPreferences);
            }
            if (setStructureTabOrder) {
                // PDFBox 3.0.7 has no PDPage tab-order accessor and no COSName.TABS constant, so
                // set the /Tabs key on each page dictionary directly.
                COSName tabsKey = COSName.getPDFName("Tabs");
                for (PDPage page : document.getPages()) {
                    page.getCOSObject().setItem(tabsKey, COSName.S);
                }
            }
            return WebResponseUtils.pdfDocToWebResponse(
                    document,
                    GeneralUtils.generateFilename(
                            fileInput.getOriginalFilename(), "_accessible.pdf"),
                    tempFileManager);
        }
    }

    private static void requirePdf(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw ExceptionUtils.createIllegalArgumentException(
                    "error.fileFormatRequired", "{0} must be in PDF format", "file");
        }
    }
}
